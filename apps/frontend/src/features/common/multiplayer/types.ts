export type GameType = "tic-tac-toe" | "hangman" | "minesweeper" | "generic";

export type PlayerRole = "player" | "spectator";

export type HostLeaveAction = "end_session" | "keep_going";

export type RoomStatus = "finished" | "in_progress" | "waiting";

export interface Player {
  connectedAt: number;
  id: string;
  isReady: boolean;
  name: string;
  role: PlayerRole;
  symbol?: string;
}

export interface RoomState<TGameState = unknown> {
  createdAt: number;
  gameState: TGameState;
  gameType: GameType;
  hostId: string;
  hostLeaveAction: HostLeaveAction;
  id: string;
  players: Record<string, Player>;
  spectators: Record<string, Player>;
  status: RoomStatus;
  updatedAt: number;
}

export type ConnectionStatus =
  "connected" | "connecting" | "disconnected" | "error";

export type ClientMessage =
  | {
      payload: {
        hostLeaveAction?: HostLeaveAction;
        name: string;
        playerId?: string;
        role?: PlayerRole;
      };
      type: "join";
    }
  | { payload: { isReady: boolean }; type: "ready" }
  | { payload: unknown; type: "game_action" }
  | { type: "reset" }
  | { payload: { message: string }; type: "chat" }
  | { type: "ping" };

export type ServerMessage<TGameState = unknown> =
  | { payload: RoomState<TGameState>; type: "room_state" }
  | { payload: { player: Player }; type: "player_joined" }
  | { payload: { name: string; playerId: string }; type: "player_left" }
  | { payload: { action: unknown; playerId: string }; type: "game_action" }
  | {
      payload: { gameState: TGameState; status: RoomStatus };
      type: "game_state_updated";
    }
  | {
      payload: {
        message: string;
        playerId: string;
        playerName: string;
        timestamp: number;
      };
      type: "chat_message";
    }
  | { payload: { code?: string; message: string }; type: "error" }
  | { payload: { message: string }; type: "host_left" }
  | { payload: { reason: string }; type: "room_closed" }
  | { payload: { timestamp: number }; type: "pong" };
