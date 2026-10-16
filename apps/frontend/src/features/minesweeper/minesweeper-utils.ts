import { atom } from "jotai";

export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | "mine";

export interface Cell {
  value: CellValue;
  revealed: boolean;
  flagged: boolean;
  exploded?: boolean;
}

export interface MinesweeperConfig {
  rows: number;
  cols: number;
  mines: number;
}

export type DifficultyId = "beginner" | "intermediate" | "expert";

export type GameStatus = "idle" | "playing" | "won" | "lost";

export type InputMode = "dig" | "flag";

export interface CellCoord {
  row: number;
  col: number;
}

export const BEGINNER_CONFIG: MinesweeperConfig = {
  rows: 9,
  cols: 9,
  mines: 10,
};
export const INTERMEDIATE_CONFIG: MinesweeperConfig = {
  rows: 16,
  cols: 16,
  mines: 40,
};
export const EXPERT_CONFIG: MinesweeperConfig = {
  rows: 16,
  cols: 30,
  mines: 99,
};

export const DIFFICULTY_CONFIGS: Record<
  DifficultyId,
  MinesweeperConfig & { id: DifficultyId; label: string }
> = {
  beginner: { id: "beginner", label: "Beginner", ...BEGINNER_CONFIG },
  intermediate: {
    id: "intermediate",
    label: "Intermediate",
    ...INTERMEDIATE_CONFIG,
  },
  expert: { id: "expert", label: "Expert", ...EXPERT_CONFIG },
};

const DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const;

export const createEmptyBoard = ({
  rows,
  cols,
}: Pick<MinesweeperConfig, "rows" | "cols">): Cell[][] => {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      value: 0 as CellValue,
      revealed: false,
      flagged: false,
      exploded: false,
    }))
  );
};

export const getNeighborCoords = (
  row: number,
  col: number,
  rows: number,
  cols: number
): [number, number][] => {
  const coords: [number, number][] = [];

  for (const [dx, dy] of DIRECTIONS) {
    const nextRow = row + dx;
    const nextCol = col + dy;
    if (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols) {
      coords.push([nextRow, nextCol]);
    }
  }

  return coords;
};

const shuffle = <T>(items: T[]): T[] => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const index_ = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[index_]] = [shuffled[index_], shuffled[index]];
  }

  return shuffled;
};

export const generateBoard = (
  { rows, cols, mines }: MinesweeperConfig,
  excluded: [number, number][] = []
): Cell[][] => {
  const board = createEmptyBoard({ rows, cols });
  const excludedSet = new Set(excluded.map(([row, col]) => `${row},${col}`));
  const positions: [number, number][] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!excludedSet.has(`${row},${col}`)) {
        positions.push([row, col]);
      }
    }
  }

  const minePositions = shuffle(positions).slice(0, mines);

  for (const [row, col] of minePositions) {
    board[row][col].value = "mine";
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row][col].value === "mine") {
        continue;
      }

      let mineCount = 0;
      for (const [nextRow, nextCol] of getNeighborCoords(
        row,
        col,
        rows,
        cols
      )) {
        if (board[nextRow][nextCol].value === "mine") {
          mineCount++;
        }
      }

      board[row][col].value = mineCount as CellValue;
    }
  }

  return board;
};

export const placeMinesExcludingClick = (
  config: MinesweeperConfig,
  row: number,
  col: number
): Cell[][] => {
  const excluded: [number, number][] = [
    [row, col],
    ...getNeighborCoords(row, col, config.rows, config.cols),
  ];
  const available = config.rows * config.cols - excluded.length;

  return available < config.mines
    ? generateBoard(config, [[row, col]])
    : generateBoard(config, excluded);
};

export const cloneBoard = (board: Cell[][]): Cell[][] =>
  board.map((row) => row.map((cell) => ({ ...cell })));

export const hasMines = (board: Cell[][]): boolean =>
  board.some((row) => row.some((cell) => cell.value === "mine"));

export const isWon = (board: Cell[][]): boolean => {
  return board.every((row) =>
    row.every((cell) =>
      cell.value === "mine" ? !cell.revealed : cell.revealed
    )
  );
};

export const isLost = (board: Cell[][]): boolean =>
  board.some((row) =>
    row.some((cell) => cell.value === "mine" && cell.revealed)
  );

const autoFlagMinesIfWon = (board: Cell[][]): void => {
  if (!hasMines(board) || isLost(board) || !isWon(board)) {
    return;
  }

  for (const row of board) {
    for (const cell of row) {
      if (cell.value === "mine") {
        cell.flagged = true;
      }
    }
  }
};

export const revealWithFloodFill = (
  board: Cell[][],
  row: number,
  col: number
): Cell[][] => {
  const cell = board[row]?.[col];
  if (!cell || cell.revealed || cell.flagged) {
    return board;
  }

  if (cell.value === "mine") {
    cell.exploded = true;
    cell.revealed = true;

    for (const boardRow of board) {
      for (const boardCell of boardRow) {
        if (boardCell.value === "mine" && !boardCell.flagged) {
          boardCell.revealed = true;
        }
      }
    }
    return board;
  }

  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const queue: [number, number][] = [[row, col]];

  while (queue.length > 0) {
    const [currentRow, currentCol] = queue.pop()!;
    const current = board[currentRow][currentCol];

    if (current.revealed || current.flagged) {
      continue;
    }

    current.revealed = true;

    if (current.value === 0) {
      for (const [nextRow, nextCol] of getNeighborCoords(
        currentRow,
        currentCol,
        rows,
        cols
      )) {
        const neighbor = board[nextRow][nextCol];
        if (
          !neighbor.revealed &&
          !neighbor.flagged &&
          neighbor.value !== "mine"
        ) {
          queue.push([nextRow, nextCol]);
        }
      }
    }
  }

  autoFlagMinesIfWon(board);

  return board;
};

export const chordReveal = (
  board: Cell[][],
  row: number,
  col: number
): Cell[][] => {
  const cell = board[row]?.[col];
  if (
    !cell ||
    !cell.revealed ||
    typeof cell.value !== "number" ||
    cell.value === 0
  ) {
    return board;
  }

  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const neighbors = getNeighborCoords(row, col, rows, cols);

  const flaggedNeighbors = neighbors.reduce(
    (count, [nRow, nCol]) => count + (board[nRow][nCol].flagged ? 1 : 0),
    0
  );

  if (flaggedNeighbors !== cell.value) {
    return board;
  }

  for (const [nRow, nCol] of neighbors) {
    const neighbor = board[nRow][nCol];
    if (!neighbor.flagged && !neighbor.revealed) {
      revealWithFloodFill(board, nRow, nCol);
    }
  }

  return board;
};

export const toggleFlag = (
  board: Cell[][],
  row: number,
  col: number,
  maxMines?: number
): Cell[][] => {
  const cell = board[row]?.[col];
  if (!cell || cell.revealed) {
    return board;
  }

  if (!cell.flagged && typeof maxMines === "number") {
    let flaggedCount = 0;
    for (const boardRow of board) {
      for (const boardCell of boardRow) {
        if (boardCell.flagged) {
          flaggedCount++;
        }
      }
    }
    if (flaggedCount >= maxMines) {
      return board;
    }
  }

  cell.flagged = !cell.flagged;
  return board;
};

export const getBoardStats = (board: Cell[][], config: MinesweeperConfig) => {
  let flaggedCount = 0;
  let revealedSafeCount = 0;
  const totalSafeCells = config.rows * config.cols - config.mines;

  for (const row of board) {
    for (const cell of row) {
      if (cell.flagged) {
        flaggedCount++;
      }
      if (cell.revealed && cell.value !== "mine") {
        revealedSafeCount++;
      }
    }
  }

  const isMinesPlaced = hasMines(board);
  const hasLost = isLost(board);
  const hasWon = isMinesPlaced && !hasLost && isWon(board);

  let status: GameStatus = "idle";
  if (hasLost) {
    status = "lost";
  } else if (hasWon) {
    status = "won";
  } else if (isMinesPlaced) {
    status = "playing";
  }

  return {
    status,
    flagsRemaining: Math.max(0, config.mines - flaggedCount),
    flaggedCount,
    revealedSafeCount,
    totalSafeCells,
    hasWon,
    hasLost,
  };
};

export const difficultyAtom = atom<DifficultyId>("beginner");

export const configAtom = atom<MinesweeperConfig>(
  (get) => DIFFICULTY_CONFIGS[get(difficultyAtom)]
);

export const inputModeAtom = atom<InputMode>("dig");

export const elapsedSecondsAtom = atom<number>(0);

export const boardAtom = atom<Cell[][]>(createEmptyBoard(BEGINNER_CONFIG));

export const minesweeperStatsAtom = atom((get) =>
  getBoardStats(get(boardAtom), get(configAtom))
);

export const setDifficultyAtom = atom(
  null,
  (_get, set, difficulty: DifficultyId) => {
    set(difficultyAtom, difficulty);
    set(boardAtom, createEmptyBoard(DIFFICULTY_CONFIGS[difficulty]));
    set(elapsedSecondsAtom, 0);
    set(inputModeAtom, "dig");
  }
);

export const resetBoardAtom = atom(null, (get, set) => {
  const config = get(configAtom);
  set(boardAtom, createEmptyBoard(config));
  set(elapsedSecondsAtom, 0);
});

export const revealCellAtom = atom(
  null,
  (get, set, { row, col }: CellCoord) => {
    const stats = get(minesweeperStatsAtom);
    if (stats.status === "won" || stats.status === "lost") {
      return;
    }

    const config = get(configAtom);
    let board = cloneBoard(get(boardAtom));
    const cell = board[row]?.[col];
    if (!cell) {
      return;
    }

    if (cell.revealed) {
      if (typeof cell.value === "number" && cell.value > 0) {
        set(boardAtom, chordReveal(board, row, col));
      }
      return;
    }

    if (cell.flagged) {
      return;
    }

    if (stats.status === "idle") {
      const previousBoard = board;
      board = placeMinesExcludingClick(config, row, col);
      for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < config.cols; c++) {
          if (previousBoard[r]?.[c]?.flagged && !(r === row && c === col)) {
            board[r][c].flagged = true;
          }
        }
      }
      set(elapsedSecondsAtom, 0);
    }

    set(boardAtom, revealWithFloodFill(board, row, col));
  }
);

export const toggleFlagAtom = atom(
  null,
  (get, set, { row, col }: CellCoord) => {
    const stats = get(minesweeperStatsAtom);
    if (stats.status === "won" || stats.status === "lost") {
      return;
    }

    const config = get(configAtom);
    set(
      boardAtom,
      toggleFlag(cloneBoard(get(boardAtom)), row, col, config.mines)
    );
  }
);
