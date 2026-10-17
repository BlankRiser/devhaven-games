import type { Player, RoomStatus } from "../types";

export type BoardCell = string | null;
export type GameOutcome = "draw" | "O" | "X" | null;

export interface Scores {
  O: number;
  X: number;
  draws: number;
}

export interface TicTacToeState {
  board: BoardCell[];
  currentTurn: "O" | "X";
  playerSymbols: Record<string, "O" | "X">;
  scores: Scores;
  winner: GameOutcome;
  winningLine: number[] | null;
}

const WINNING_COMBINATIONS: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export const createInitialTicTacToeState = (): TicTacToeState => {
  return {
    board: Array.from({ length: 9 }, () => null),
    currentTurn: "X",
    playerSymbols: {},
    scores: {
      O: 0,
      X: 0,
      draws: 0,
    },
    winner: null,
    winningLine: null,
  };
};

export const assignPlayerSymbols = (
  state: TicTacToeState,
  players: Record<string, Player>
): TicTacToeState => {
  const [firstId, secondId] = Object.keys(players);
  const updatedSymbols: Record<string, "O" | "X"> = {};

  if (typeof firstId === "string") {
    const existing = Object.hasOwn(state.playerSymbols, firstId)
      ? state.playerSymbols[firstId]
      : "X";
    updatedSymbols[firstId] = existing;
    players[firstId].symbol = existing;
  }

  if (typeof secondId === "string") {
    const taken = firstId ? updatedSymbols[firstId] : undefined;
    const fallback: "O" | "X" = taken === "X" ? "O" : "X";
    const existing = Object.hasOwn(state.playerSymbols, secondId)
      ? state.playerSymbols[secondId]
      : fallback;
    updatedSymbols[secondId] = existing;
    players[secondId].symbol = existing;
  }

  return {
    ...state,
    playerSymbols: updatedSymbols,
  };
};

const checkWinner = (
  board: BoardCell[],
  symbol: "O" | "X"
): { winner: GameOutcome; winningLine: number[] | null } => {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] === symbol && board[b] === symbol && board[c] === symbol) {
      return { winner: symbol, winningLine: [a, b, c] };
    }
  }

  const isFull = board.every((cell) => cell !== null);
  return {
    winner: isFull ? "draw" : null,
    winningLine: null,
  };
};

export const handleTicTacToeAction = (
  state: TicTacToeState,
  playerId: string,
  rawAction: unknown
): { error?: string; newState: TicTacToeState; status: RoomStatus } => {
  if (
    typeof rawAction !== "object" ||
    rawAction === null ||
    !("type" in rawAction) ||
    !("cellIndex" in rawAction)
  ) {
    return {
      error:
        "Invalid action format. Expected { type: 'move', cellIndex: number }",
      newState: state,
      status: "in_progress",
    };
  }

  const { cellIndex, type } = rawAction as Record<string, unknown>;

  if (type !== "move" || !Number.isSafeInteger(cellIndex)) {
    return {
      error: "Invalid action type or cellIndex. cellIndex must be an integer.",
      newState: state,
      status: "in_progress",
    };
  }

  const index = cellIndex as number;
  if (index < 0 || index > 8) {
    return {
      error: "cellIndex must be between 0 and 8",
      newState: state,
      status: "in_progress",
    };
  }

  if (state.winner !== null) {
    return {
      error: "Game has already concluded. Reset to play again.",
      newState: state,
      status: "finished",
    };
  }

  if (!Object.hasOwn(state.playerSymbols, playerId)) {
    return {
      error: "You are not assigned as a player in this game.",
      newState: state,
      status: "in_progress",
    };
  }

  const playerSymbol = state.playerSymbols[playerId];

  if (playerSymbol !== state.currentTurn) {
    return {
      error: `It is not your turn. Current turn: ${state.currentTurn}`,
      newState: state,
      status: "in_progress",
    };
  }

  if (state.board[index] !== null) {
    return {
      error: "This cell is already occupied.",
      newState: state,
      status: "in_progress",
    };
  }

  const newBoard = [...state.board];
  newBoard[index] = playerSymbol;

  const { winner, winningLine } = checkWinner(newBoard, playerSymbol);

  const newScores = { ...state.scores };
  let status: RoomStatus = "in_progress";

  switch (winner) {
    case "X": {
      newScores.X += 1;
      status = "finished";
      break;
    }
    case "O": {
      newScores.O += 1;
      status = "finished";
      break;
    }
    case "draw": {
      newScores.draws += 1;
      status = "finished";
      break;
    }
    case null: {
      break;
    }
    default: {
      break;
    }
  }

  const nextTurn = state.currentTurn === "X" ? "O" : "X";

  const newState: TicTacToeState = {
    ...state,
    board: newBoard,
    currentTurn: winner === null ? nextTurn : state.currentTurn,
    playerSymbols: state.playerSymbols,
    scores: newScores,
    winner,
    winningLine,
  };

  return { newState, status };
};

export const resetTicTacToeGame = (state: TicTacToeState): TicTacToeState => {
  return {
    ...state,
    board: Array.from({ length: 9 }, () => null),
    currentTurn: "X",
    winner: null,
    winningLine: null,
  };
};
