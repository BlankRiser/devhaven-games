export type LocalPlayer = "o" | "x";
export type LocalCellState = LocalPlayer | null;
export type LocalWinner = "o" | "x";
export type LocalGameOutcome = "draw" | LocalWinner | null;

export interface LocalScores {
  draw: number;
  o: number;
  x: number;
}

export interface OnlineScores {
  O: number;
  X: number;
  draws: number;
}

export type OnlinePlayerSymbol = "O" | "X";
export type OnlineWinner = "O" | "X";
export type OnlineGameOutcome = "draw" | OnlineWinner | null;

export interface OnlineTicTacToeState {
  board: (string | null)[];
  currentTurn: OnlinePlayerSymbol;
  playerSymbols: Record<string, OnlinePlayerSymbol>;
  scores: OnlineScores;
  winner: OnlineGameOutcome;
  winningLine: number[] | null;
}

const emptyBoard: readonly (readonly LocalCellState[])[] = [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

export const createEmptyLocalBoard = (): LocalCellState[][] =>
  emptyBoard.map((row) => [...row]);

const winningLines: readonly (readonly [
  readonly [number, number],
  readonly [number, number],
  readonly [number, number],
])[] = [
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  [
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  [
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 2],
    [1, 2],
    [2, 2],
  ],
  [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  [
    [0, 2],
    [1, 1],
    [2, 0],
  ],
];

export const checkForLocalWinner = (
  board: LocalCellState[][]
): LocalGameOutcome => {
  for (const [firstCoord, secondCoord, thirdCoord] of winningLines) {
    const first = board[firstCoord[0]]?.[firstCoord[1]];
    const second = board[secondCoord[0]]?.[secondCoord[1]];
    const third = board[thirdCoord[0]]?.[thirdCoord[1]];
    if (first && first === second && first === third) {
      return first;
    }
  }

  const isFull = board.every((row) => row.every((cell) => cell !== null));
  return isFull ? "draw" : null;
};
