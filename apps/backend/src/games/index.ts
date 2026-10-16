import {
  assignPlayerSymbols,
  createInitialTicTacToeState,
  handleTicTacToeAction,
  resetTicTacToeGame,
} from "./tic-tac-toe";
import type { TicTacToeState } from "./tic-tac-toe";
import type { GameType, Player, RoomStatus } from "../types";

export interface GameEngine<TState = unknown> {
  createInitialState: () => TState;
  handleAction: (
    state: TState,
    playerId: string,
    action: unknown
  ) => { error?: string; newState: TState; status: RoomStatus };
  onPlayersChanged: (state: TState, players: Record<string, Player>) => TState;
  resetGame: (state: TState) => TState;
}

const isTicTacToeState = (state: unknown): state is TicTacToeState =>
  typeof state === "object" && state !== null && "board" in state;

export const gameEngines: Record<GameType, GameEngine> = {
  generic: {
    createInitialState: () => ({}),
    handleAction: (state, _playerId, action) => {
      const record = typeof state === "object" && state !== null ? state : {};
      return {
        newState: { ...record, lastAction: action },
        status: "in_progress",
      };
    },
    onPlayersChanged: (state) => state,
    resetGame: () => ({}),
  },
  hangman: {
    createInitialState: () => {
      return {
        guessedLetters: [],
        remainingGuesses: 6,
        word: "",
      };
    },
    handleAction: (state, _playerId, action) => {
      const record = typeof state === "object" && state !== null ? state : {};
      return {
        newState: { ...record, lastAction: action },
        status: "in_progress",
      };
    },
    onPlayersChanged: (state) => state,
    resetGame: (state) => state,
  },
  minesweeper: {
    createInitialState: () => {
      return {
        flags: [],
        grid: [],
        isOver: false,
      };
    },
    handleAction: (state, _playerId, action) => {
      const record = typeof state === "object" && state !== null ? state : {};
      return {
        newState: { ...record, lastAction: action },
        status: "in_progress",
      };
    },
    onPlayersChanged: (state) => state,
    resetGame: (state) => state,
  },
  "tic-tac-toe": {
    createInitialState: createInitialTicTacToeState,
    handleAction: (state, playerId, action) => {
      const validState = isTicTacToeState(state)
        ? state
        : createInitialTicTacToeState();
      return handleTicTacToeAction(validState, playerId, action);
    },
    onPlayersChanged: (state, players) => {
      const validState = isTicTacToeState(state)
        ? state
        : createInitialTicTacToeState();
      return assignPlayerSymbols(validState, players);
    },
    resetGame: (state) => {
      const validState = isTicTacToeState(state)
        ? state
        : createInitialTicTacToeState();
      return resetTicTacToeGame(validState);
    },
  },
};

export const getGameEngine = (gameType: GameType): GameEngine =>
  gameEngines[gameType];
