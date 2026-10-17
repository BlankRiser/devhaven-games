import { DurableObject } from "cloudflare:workers";
import { getGameEngine } from "./games";
import type {
  ClientMessage,
  GameType,
  HostLeaveAction,
  Player,
  PlayerRole,
  RoomState,
  ServerMessage,
  WebSocketAttachment,
} from "./types";

export interface Environment {
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
}

const VALID_GAME_TYPES = new Set<string>(["hangman", "minesweeper", "generic"]);
const MAX_PLAYERS = 2;
const MAX_SPECTATORS = 10;
const MAX_WS_MESSAGE_BYTES = 4096;
const MAX_PLAYER_NAME_LENGTH = 32;
const MAX_CHAT_MESSAGE_LENGTH = 300;

const FORBIDDEN_OBJECT_KEYS = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);
const PLAYER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/u;

interface SocketRateLimiter {
  chatTokens: number;
  lastCheck: number;
  messageTokens: number;
}

const sanitizeString = (raw: string, maxLength: number): string => {
  // eslint-disable-next-line no-control-regex
  const stripped = raw.replaceAll(/[\u{0000}-\u{001F}\u{007F}-\u{009F}]/gu, "");
  return stripped.replaceAll(/[<>]/gu, "").trim().slice(0, maxLength);
};

export class GameRoom extends DurableObject<Environment> {
  private isInitialized = false;
  private readonly socketRateLimits = new WeakMap<WebSocket, SocketRateLimiter>();
  private state: RoomState | null = null;

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const roomId = url.searchParams.get("roomId") ?? "default";
    const rawGameType = url.searchParams.get("gameType") ?? "";
    const gameType: GameType = VALID_GAME_TYPES.has(rawGameType)
      ? (rawGameType as GameType)
      : "tic-tac-toe";

    const rawHostAction = url.searchParams.get("hostLeaveAction");
    const hostLeaveAction: HostLeaveAction =
      rawHostAction === "end_session" ? "end_session" : "keep_going";

    await this.initialize(roomId, gameType, hostLeaveAction);
    const room = this.state;
    if (room === null) {
      return new Response("Room not initialized", { status: 500 });
    }

    // If regular HTTP GET request, return room metadata
    if (request.headers.get("Upgrade") !== "websocket") {
      return Response.json(room);
    }

    const { playerId, playerName } = this.parseCredentials(
      url.searchParams,
      room.players
    );

    if (this.isRoomAtCapacity(room, playerId)) {
      return new Response("Room is at maximum capacity (12 participants)", {
        status: 429,
      });
    }

    // Handle WebSocket upgrade
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    // Close any previous zombie sockets for this player before accepting the new one
    for (const oldSocket of this.ctx.getWebSockets(playerId)) {
      try {
        oldSocket.close(1000, "Reconnected");
      } catch {
        // Socket already closed
      }
    }

    const finalRole = this.resolvePlayerRole(
      room,
      playerId,
      url.searchParams.get("role")
    );

    const attachment: WebSocketAttachment = {
      joinedAt: Date.now(),
      name: playerName,
      playerId,
      role: finalRole,
    };

    // Accept WebSocket using Hibernation API and tag with playerId
    this.ctx.acceptWebSocket(server, [playerId]);
    server.serializeAttachment(attachment);

    const newPlayer: Player = {
      connectedAt: attachment.joinedAt,
      id: playerId,
      isReady: false,
      name: playerName,
      role: finalRole,
    };

    if (finalRole === "player") {
      room.players = { ...room.players, [playerId]: newPlayer };
    } else {
      room.spectators = { ...room.spectators, [playerId]: newPlayer };
    }

    if (room.hostId.length === 0) {
      room.hostId = playerId;
    }

    if (Object.keys(room.players).length >= 2 && room.status === "waiting") {
      room.status = "in_progress";
    }

    const engine = getGameEngine(room.gameType);
    room.gameState = engine.onPlayersChanged(room.gameState, room.players);
    room.updatedAt = Date.now();

    await this.saveRoomState(room);

    this.broadcast({
      payload: room,
      type: "room_state",
    });

    this.broadcast(
      {
        payload: { player: newPlayer },
        type: "player_joined",
      },
      server
    );

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer
  ): Promise<void> {
    const rawAttachment = ws.deserializeAttachment();
    const attachment =
      typeof rawAttachment === "object" && rawAttachment !== null
        ? (rawAttachment as WebSocketAttachment)
        : null;

    if (attachment === null || this.state === null) {
      return;
    }

    // Frame size ceiling: drop messages exceeding 4KB
    const messageSize =
      typeof message === "string" ? message.length : message.byteLength;
    if (messageSize > MAX_WS_MESSAGE_BYTES) {
      this.send(ws, {
        payload: {
          code: "FRAME_TOO_LARGE",
          message: "Message exceeds maximum allowed size (4KB)",
        },
        type: "error",
      });
      return;
    }

    // Per-socket message rate limit check
    const limiter = this.getRateLimiter(ws);
    if (limiter.messageTokens < 1) {
      this.send(ws, {
        payload: {
          code: "RATE_LIMITED",
          message: "Too many messages. Please slow down.",
        },
        type: "error",
      });
      return;
    }
    limiter.messageTokens -= 1;

    const parsed = this.parseMessage(message);
    if (parsed === null) {
      this.send(ws, {
        payload: {
          message: "Failed to parse message",
        },
        type: "error",
      });
      return;
    }

    try {
      await this.processClientMessage(ws, attachment, parsed, limiter);
    } catch (error) {
      console.error("Unhandled error processing WebSocket message:", error);
      this.send(ws, {
        payload: {
          message: "Internal server error processing message",
        },
        type: "error",
      });
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    const rawAttachment = ws.deserializeAttachment();
    const attachment =
      typeof rawAttachment === "object" && rawAttachment !== null
        ? (rawAttachment as WebSocketAttachment)
        : null;

    if (attachment === null || this.state === null) {
      return;
    }

    const room = this.state;
    const { name, playerId } = attachment;

    // Check if player has another active socket (e.g. from a quick reconnect/refresh)
    if (this.ctx.getWebSockets(playerId).length > 0) {
      return;
    }

    this.removeParticipant(room, playerId);

    if (room.hostId === playerId) {
      const hasSessionEnded = await this.handleHostLeft(room);
      if (hasSessionEnded) {
        return;
      }
    }

    if (this.isRoomEmpty(room)) {
      await this.ctx.storage.deleteAll();
      this.state = null;
      return;
    }

    const engine = getGameEngine(room.gameType);
    room.gameState = engine.onPlayersChanged(room.gameState, room.players);

    if (Object.keys(room.players).length < 2 && room.status === "in_progress") {
      room.status = "waiting";
    }

    room.updatedAt = Date.now();
    await this.saveRoomState(room);

    this.broadcast({
      payload: { name, playerId },
      type: "player_left",
    });

    this.broadcast({
      payload: room,
      type: "room_state",
    });
  }

  webSocketError(ws: WebSocket, error: unknown): void {
    console.error("WebSocket error on Durable Object:", error);
    try {
      ws.close(1011, "Internal WebSocket error");
    } catch {
      // Socket might already be closing/closed
    }
  }

  private getRateLimiter(ws: WebSocket): SocketRateLimiter {
    let limiter = this.socketRateLimits.get(ws);
    const now = Date.now();
    if (!limiter) {
      limiter = {
        chatTokens: 4,
        lastCheck: now,
        messageTokens: 20,
      };
      this.socketRateLimits.set(ws, limiter);
      return limiter;
    }

    const elapsed = (now - limiter.lastCheck) / 1000;
    limiter.lastCheck = now;
    limiter.messageTokens = Math.min(20, limiter.messageTokens + elapsed * 10);
    limiter.chatTokens = Math.min(4, limiter.chatTokens + elapsed * 1);

    return limiter;
  }

  private async saveRoomState(room: RoomState): Promise<void> {
    try {
      await this.ctx.storage.put("room_state", room);
    } catch (error) {
      console.error("Failed to persist room state to storage:", error);
    }
  }

  private removeParticipant(room: RoomState, playerId: string): void {
    const remainingPlayers: Record<string, Player> = {};
    for (const [id, player] of Object.entries(room.players)) {
      if (id !== playerId) {
        remainingPlayers[id] = player;
      }
    }

    const remainingSpectators: Record<string, Player> = {};
    for (const [id, spectator] of Object.entries(room.spectators)) {
      if (id !== playerId) {
        remainingSpectators[id] = spectator;
      }
    }

    room.players = remainingPlayers;
    room.spectators = remainingSpectators;
  }

  private isRoomEmpty(room: RoomState): boolean {
    return (
      Object.keys(room.players).length === 0 &&
      Object.keys(room.spectators).length === 0
    );
  }

  private parseCredentials(
    searchParameters: URLSearchParams,
    currentPlayers: Record<string, Player>
  ): { playerId: string; playerName: string } {
    const rawId = searchParameters.get("playerId");
    const playerId =
      typeof rawId === "string" &&
      PLAYER_ID_PATTERN.test(rawId) &&
      !FORBIDDEN_OBJECT_KEYS.has(rawId)
        ? rawId
        : `player_${crypto.randomUUID().slice(0, 8)}`;

    const rawName = searchParameters.get("name") ?? "";
    const cleaned = sanitizeString(rawName, MAX_PLAYER_NAME_LENGTH);
    const playerName =
      cleaned.length > 0
        ? cleaned
        : `Player ${Object.keys(currentPlayers).length + 1}`;

    return { playerId, playerName };
  }

  private isRoomAtCapacity(room: RoomState, playerId: string): boolean {
    const isExisting =
      Object.hasOwn(room.players, playerId) ||
      Object.hasOwn(room.spectators, playerId);

    if (isExisting) {
      return false;
    }

    const currentPlayersCount = Object.keys(room.players).length;
    const currentSpectatorCount = Object.keys(room.spectators).length;

    return (
      currentPlayersCount >= MAX_PLAYERS &&
      currentSpectatorCount >= MAX_SPECTATORS
    );
  }

  private resolvePlayerRole(
    room: RoomState,
    playerId: string,
    requestedRole: string | null
  ): PlayerRole {
    if (Object.hasOwn(room.players, playerId)) {
      return "player";
    }
    if (Object.hasOwn(room.spectators, playerId)) {
      return "spectator";
    }
    const currentActiveCount = Object.keys(room.players).length;
    return requestedRole === "player" && currentActiveCount < MAX_PLAYERS
      ? "player"
      : "spectator";
  }

  private async handleHostLeft(room: RoomState): Promise<boolean> {
    if (room.hostLeaveAction === "end_session") {
      this.broadcast({
        payload: { message: "The game host left the room. Session has ended." },
        type: "host_left",
      });

      for (const socket of this.ctx.getWebSockets()) {
        try {
          socket.close(1000, "Host left room");
        } catch {
          // Socket might already be closed
        }
      }

      await this.ctx.storage.deleteAll();
      this.state = null;
      return true;
    }

    const remainingPlayerIds = [
      ...Object.keys(room.players),
      ...Object.keys(room.spectators),
    ];
    room.hostId = remainingPlayerIds[0] ?? "";
    return false;
  }

  private parseMessage(message: string | ArrayBuffer): ClientMessage | null {
    const decoder = new TextDecoder();
    const rawText =
      typeof message === "string" ? message : decoder.decode(message);
    try {
      return JSON.parse(rawText) as ClientMessage;
    } catch {
      return null;
    }
  }

  private async initialize(
    roomId: string,
    gameType: GameType,
    hostLeaveAction: HostLeaveAction
  ): Promise<void> {
    if (this.isInitialized && this.state !== null) {
      return;
    }

    const storedState = await this.ctx.storage.get<RoomState>("room_state");
    if (storedState === undefined) {
      const engine = getGameEngine(gameType);
      const now = Date.now();
      this.state = {
        createdAt: now,
        gameState: engine.createInitialState(),
        gameType,
        hostId: "",
        hostLeaveAction,
        id: roomId,
        players: {},
        spectators: {},
        status: "waiting",
        updatedAt: now,
      };
      await this.saveRoomState(this.state);
    } else {
      this.state = storedState;
    }

    this.isInitialized = true;
  }

  private handleChatAction(
    ws: WebSocket,
    attachment: WebSocketAttachment,
    rawPayload: unknown,
    limiter: SocketRateLimiter
  ): void {
    if (
      typeof rawPayload !== "object" ||
      rawPayload === null ||
      !("message" in rawPayload) ||
      typeof rawPayload.message !== "string"
    ) {
      this.send(ws, {
        payload: { message: "Invalid chat payload format" },
        type: "error",
      });
      return;
    }

    if (limiter.chatTokens < 1) {
      this.send(ws, {
        payload: {
          code: "CHAT_RATE_LIMITED",
          message: "Chatting too fast. Please wait a moment.",
        },
        type: "error",
      });
      return;
    }
    limiter.chatTokens -= 1;

    const { message } = rawPayload;
    const text = sanitizeString(message, MAX_CHAT_MESSAGE_LENGTH);
    if (text.length === 0) {
      return;
    }

    this.broadcast({
      payload: {
        message: text,
        playerId: attachment.playerId,
        playerName: attachment.name,
        timestamp: Date.now(),
      },
      type: "chat_message",
    });
  }

  private async handleReadyAction(
    ws: WebSocket,
    attachment: WebSocketAttachment,
    rawPayload: unknown,
    room: RoomState
  ): Promise<void> {
    if (
      typeof rawPayload !== "object" ||
      rawPayload === null ||
      !("isReady" in rawPayload) ||
      typeof rawPayload.isReady !== "boolean"
    ) {
      this.send(ws, {
        payload: { message: "Invalid ready payload format" },
        type: "error",
      });
      return;
    }

    if (!Object.hasOwn(room.players, attachment.playerId)) {
      this.send(ws, {
        payload: { message: "Only active players can set ready status." },
        type: "error",
      });
      return;
    }

    const { isReady } = rawPayload;
    const player = room.players[attachment.playerId];
    player.isReady = isReady;
    const active = Object.values(room.players);
    if (active.length >= 2 && active.every((p) => p.isReady)) {
      room.status = "in_progress";
    }

    room.updatedAt = Date.now();
    await this.saveRoomState(room);
    this.broadcast({ payload: room, type: "room_state" });
  }

  private async handleGameAction(
    ws: WebSocket,
    attachment: WebSocketAttachment,
    rawPayload: unknown,
    room: RoomState
  ): Promise<void> {
    if (!Object.hasOwn(room.players, attachment.playerId)) {
      this.send(ws, {
        payload: { message: "Spectators cannot perform game actions." },
        type: "error",
      });
      return;
    }

    if (rawPayload === undefined || rawPayload === null) {
      this.send(ws, {
        payload: { message: "Missing game action payload." },
        type: "error",
      });
      return;
    }

    const engine = getGameEngine(room.gameType);
    const result = engine.handleAction(
      room.gameState,
      attachment.playerId,
      rawPayload
    );

    if (result.error !== undefined) {
      this.send(ws, {
        payload: { message: result.error },
        type: "error",
      });
      return;
    }

    room.gameState = result.newState;
    room.status = result.status;
    room.updatedAt = Date.now();
    await this.saveRoomState(room);

    this.broadcast({
      payload: {
        gameState: room.gameState,
        status: room.status,
      },
      type: "game_state_updated",
    });
  }

  private async handleResetAction(
    ws: WebSocket,
    attachment: WebSocketAttachment,
    room: RoomState
  ): Promise<void> {
    const isPlayer = Object.hasOwn(room.players, attachment.playerId);
    const isHost = attachment.playerId === room.hostId;
    if (!isPlayer && !isHost) {
      this.send(ws, {
        payload: {
          message: "Only active players or the room host can reset the game.",
        },
        type: "error",
      });
      return;
    }

    const engine = getGameEngine(room.gameType);
    room.gameState = engine.resetGame(room.gameState);
    room.status = "in_progress";
    room.updatedAt = Date.now();
    await this.saveRoomState(room);

    this.broadcast({
      payload: {
        gameState: room.gameState,
        status: room.status,
      },
      type: "game_state_updated",
    });
  }

  private async processClientMessage(
    ws: WebSocket,
    attachment: WebSocketAttachment,
    parsed: ClientMessage,
    limiter: SocketRateLimiter
  ): Promise<void> {
    const room = this.state;
    if (room === null) {
      return;
    }

    switch (parsed.type) {
      case "ping": {
        this.send(ws, { payload: { timestamp: Date.now() }, type: "pong" });
        break;
      }

      case "chat": {
        this.handleChatAction(ws, attachment, parsed.payload, limiter);
        break;
      }

      case "ready": {
        await this.handleReadyAction(ws, attachment, parsed.payload, room);
        break;
      }

      case "game_action": {
        await this.handleGameAction(ws, attachment, parsed.payload, room);
        break;
      }

      case "reset": {
        await this.handleResetAction(ws, attachment, room);
        break;
      }

      case "join": {
        break;
      }

      default: {
        break;
      }
    }
  }

  private send(ws: WebSocket, message: ServerMessage): void {
    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("Failed to send WebSocket message:", error);
    }
  }

  private broadcast(message: ServerMessage, excludeWs?: WebSocket): void {
    const raw = JSON.stringify(message);
    const sockets = this.ctx.getWebSockets();
    for (const socket of sockets) {
      if (excludeWs !== undefined && socket === excludeWs) {
        continue;
      }
      try {
        socket.send(raw);
      } catch (error) {
        console.error("Failed to broadcast message to socket:", error);
      }
    }
  }
}
