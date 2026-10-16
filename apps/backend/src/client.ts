import type {
  ClientMessage,
  GameType,
  PlayerRole,
  RoomState,
  ServerMessage,
} from "./types";

export interface ConnectOptions {
  backendUrl: string;
  gameType?: GameType;
  name: string;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: ServerMessage) => void;
  onOpen?: () => void;
  playerId?: string;
  role?: PlayerRole;
  roomId: string;
}

export interface EventCallbackMap {
  chat_message: (payload: {
    message: string;
    playerId: string;
    playerName: string;
    timestamp: number;
  }) => void;
  error: (payload: { code?: string; message: string }) => void;
  game_state_updated: (payload: { gameState: unknown; status: string }) => void;
  player_joined: (payload: { player: unknown }) => void;
  player_left: (payload: { name: string; playerId: string }) => void;
  pong: (payload: { timestamp: number }) => void;
  room_state: (state: RoomState) => void;
}

export class MultiplayerClient {
  private readonly listeners = new Map<string, Set<(payload: unknown) => void>>();
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private socket: WebSocket | null = null;

  connect(options: ConnectOptions): void {
    this.disconnect();

    const wsProtocol = options.backendUrl.startsWith("https") ? "wss" : "ws";
    const host = options.backendUrl.replace(/^https?:\/\//u, "");

    const parameters = new URLSearchParams({
      gameType: options.gameType ?? "tic-tac-toe",
      name: options.name,
      role: options.role ?? "player",
      roomId: options.roomId,
    });

    if (
      typeof options.playerId === "string" &&
      options.playerId.trim().length > 0
    ) {
      parameters.set("playerId", options.playerId);
    }

    const wsUrl = `${wsProtocol}://${host}/rooms/${options.roomId}/ws?${parameters.toString()}`;
    const ws = new WebSocket(wsUrl);
    this.socket = ws;

    ws.addEventListener("open", () => {
      options.onOpen?.();
      this.pingInterval = setInterval(() => {
        this.send({ type: "ping" });
      }, 30_000);
    });

    ws.addEventListener("message", (event: MessageEvent) => {
      this.handleIncomingMessage(event, options.onMessage);
    });

    ws.addEventListener("close", (event: CloseEvent) => {
      this.cleanup();
      options.onClose?.(event);
    });

    ws.addEventListener("error", (event: Event) => {
      options.onError?.(event);
    });
  }

  on<K extends keyof EventCallbackMap>(
    event: K,
    listener: EventCallbackMap[K]
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    const handler = listener as (payload: unknown) => void;
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  }

  send(message: ClientMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  sendAction(action: unknown): void {
    this.send({
      payload: action,
      type: "game_action",
    });
  }

  sendChat(message: string): void {
    this.send({
      payload: { message },
      type: "chat",
    });
  }

  setReady(isReady: boolean): void {
    this.send({
      payload: { isReady },
      type: "ready",
    });
  }

  resetGame(): void {
    this.send({ type: "reset" });
  }

  disconnect(): void {
    this.cleanup();
    if (this.socket === null) {
      return;
    }
    this.socket.close();
    this.socket = null;
  }

  private handleIncomingMessage(
    event: MessageEvent,
    onMessage?: (message: ServerMessage) => void
  ): void {
    const data: unknown = event.data;
    let raw: string;
    if (typeof data === "string") {
      raw = data;
    } else if (data instanceof ArrayBuffer) {
      const decoder = new TextDecoder();
      raw = decoder.decode(data);
    } else {
      return;
    }

    let serverMessage: ServerMessage;
    try {
      serverMessage = JSON.parse(raw) as ServerMessage;
    } catch {
      return;
    }

    onMessage?.(serverMessage);

    const callbacks = this.listeners.get(serverMessage.type);
    if (callbacks === undefined) {
      return;
    }

    for (const handler of callbacks) {
      handler(serverMessage.payload);
    }
  }

  private cleanup(): void {
    if (this.pingInterval === null) {
      return;
    }
    clearInterval(this.pingInterval);
    this.pingInterval = null;
  }
}
