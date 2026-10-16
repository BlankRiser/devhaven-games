export type GameType = "tic-tac-toe" | "hangman" | "minesweeper" | "generic";

export type PlayerRole = "player" | "spectator";

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  symbol?: string;
  isReady: boolean;
  connectedAt: number;
}

export type RoomStatus = "waiting" | "in_progress" | "finished";

export interface RoomState<TGameState = unknown> {
  id: string;
  gameType: GameType;
  status: RoomStatus;
  hostId: string;
  players: Record<string, Player>;
  spectators: Record<string, Player>;
  gameState: TGameState;
  createdAt: number;
  updatedAt: number;
}

export interface WebSocketAttachment {
  playerId: string;
  name: string;
  role: PlayerRole;
  joinedAt: number;
}

// Client to Server Messages
export type ClientMessage =
  | {
      type: "join";
      payload: { name: string; playerId?: string; role?: PlayerRole };
    }
  | { type: "ready"; payload: { isReady: boolean } }
  | { type: "game_action"; payload: unknown }
  | { type: "reset" }
  | { type: "chat"; payload: { message: string } }
  | { type: "ping" };

// Server to Client Messages
export type ServerMessage<TGameState = unknown> =
  | { type: "room_state"; payload: RoomState<TGameState> }
  | { type: "player_joined"; payload: { player: Player } }
  | { type: "player_left"; payload: { playerId: string; name: string } }
  | { type: "game_action"; payload: { playerId: string; action: unknown } }
  | {
      type: "game_state_updated";
      payload: { gameState: TGameState; status: RoomStatus };
    }
  | {
      type: "chat_message";
      payload: {
        playerId: string;
        playerName: string;
        message: string;
        timestamp: number;
      };
    }
  | { type: "error"; payload: { message: string; code?: string } }
  | { type: "pong"; payload: { timestamp: number } };
