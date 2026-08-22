import { atom } from 'jotai';

export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'mine';

export type Cell = {
  value: CellValue;
  revealed: boolean;
  flagged: boolean;
};

export type MinesweeperConfig = {
  rows: number;
  cols: number;
  mines: number;
};

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';

export type CellCoord = {
  row: number;
  col: number;
};

export const BEGINNER_CONFIG: MinesweeperConfig = { rows: 9, cols: 9, mines: 10 };

const DIRECTIONS = [
  [ -1, -1 ],
  [ -1, 0 ],
  [ -1, 1 ],
  [ 0, -1 ],
  [ 0, 1 ],
  [ 1, -1 ],
  [ 1, 0 ],
  [ 1, 1 ],
] as const;

export const createEmptyBoard = ({ rows, cols }: Pick<MinesweeperConfig, 'rows' | 'cols'>): Cell[][] => {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      value: 0 as CellValue,
      revealed: false,
      flagged: false,
    })),
  );
};

export const getNeighborCoords = (row: number, col: number, rows: number, cols: number): Array<[number, number]> => {
  const coords: Array<[number, number]> = [];

  for (const [ dx, dy ] of DIRECTIONS) {
    const nextRow = row + dx;
    const nextCol = col + dy;
    if (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols) {
      coords.push([ nextRow, nextCol ]);
    }
  }

  return coords;
};

const shuffle = <T>(items: T[]): T[] => {
  const shuffled = [ ...items ];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ shuffled[i], shuffled[j] ] = [ shuffled[j], shuffled[i] ];
  }

  return shuffled;
};

export const generateBoard = (
  { rows, cols, mines }: MinesweeperConfig,
  excluded: Array<[number, number]> = [],
): Cell[][] => {
  const board = createEmptyBoard({ rows, cols });
  const excludedSet = new Set(excluded.map(([ row, col ]) => `${row},${col}`));
  const positions: Array<[number, number]> = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!excludedSet.has(`${row},${col}`)) {
        positions.push([ row, col ]);
      }
    }
  }

  const minePositions = shuffle(positions).slice(0, mines);

  for (const [ row, col ] of minePositions) {
    board[row][col].value = 'mine';
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row][col].value === 'mine') {
        continue;
      }

      let mineCount = 0;
      for (const [ nextRow, nextCol ] of getNeighborCoords(row, col, rows, cols)) {
        if (board[nextRow][nextCol].value === 'mine') {
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
  col: number,
): Cell[][] => {
  const excluded: Array<[number, number]> = [ [ row, col ], ...getNeighborCoords(row, col, config.rows, config.cols) ];
  const available = config.rows * config.cols - excluded.length;

  if (available < config.mines) {
    return generateBoard(config, [ [ row, col ] ]);
  }

  return generateBoard(config, excluded);
};

export const cloneBoard = (board: Cell[][]): Cell[][] => {
  return board.map((row) => row.map((cell) => ({ ...cell })));
};

export const hasMines = (board: Cell[][]): boolean => {
  return board.some((row) => row.some((cell) => cell.value === 'mine'));
};

export const isWon = (board: Cell[][]): boolean => {
  return board.every((row) =>
    row.every((cell) => (cell.value === 'mine' ? !cell.revealed : cell.revealed)),
  );
};

export const isLost = (board: Cell[][]): boolean => {
  return board.some((row) => row.some((cell) => cell.value === 'mine' && cell.revealed));
};

export const revealWithFloodFill = (board: Cell[][], row: number, col: number): Cell[][] => {
  const cell = board[row]?.[col];
  if (!cell || cell.revealed || cell.flagged) {
    return board;
  }

  if (cell.value === 'mine') {
    for (const boardRow of board) {
      for (const boardCell of boardRow) {
        if (boardCell.value === 'mine') {
          boardCell.revealed = true;
        }
      }
    }
    return board;
  }

  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const queue: Array<[number, number]> = [ [ row, col ] ];

  while (queue.length > 0) {
    const [ currentRow, currentCol ] = queue.pop()!;
    const current = board[currentRow][currentCol];

    if (current.revealed || current.flagged) {
      continue;
    }

    current.revealed = true;

    if (current.value === 0) {
      for (const [ nextRow, nextCol ] of getNeighborCoords(currentRow, currentCol, rows, cols)) {
        const neighbor = board[nextRow][nextCol];
        if (!neighbor.revealed && !neighbor.flagged && neighbor.value !== 'mine') {
          queue.push([ nextRow, nextCol ]);
        }
      }
    }
  }

  return board;
};

export const toggleFlag = (board: Cell[][], row: number, col: number): Cell[][] => {
  const cell = board[row]?.[col];
  if (!cell || cell.revealed) {
    return board;
  }

  cell.flagged = !cell.flagged;
  return board;
};

export const getBoardStats = (board: Cell[][], config: MinesweeperConfig) => {
  let flaggedCount = 0;

  for (const row of board) {
    for (const cell of row) {
      if (cell.flagged) {
        flaggedCount++;
      }
    }
  }

  const minesPlaced = hasMines(board);
  const hasLost = isLost(board);
  const hasWon = minesPlaced && !hasLost && isWon(board);

  let status: GameStatus = 'idle';
  if (hasLost) {
    status = 'lost';
  } else if (hasWon) {
    status = 'won';
  } else if (minesPlaced) {
    status = 'playing';
  }

  return {
    status,
    flagsRemaining: config.mines - flaggedCount,
    hasWon,
    hasLost,
  };
};

export const boardAtom = atom<Cell[][]>(createEmptyBoard(BEGINNER_CONFIG));

export const minesweeperStatsAtom = atom((get) => getBoardStats(get(boardAtom), BEGINNER_CONFIG));

export const resetBoardAtom = atom(null, (_get, set) => {
  set(boardAtom, createEmptyBoard(BEGINNER_CONFIG));
});

export const revealCellAtom = atom(null, (get, set, { row, col }: CellCoord) => {
  const stats = get(minesweeperStatsAtom);
  if (stats.status === 'won' || stats.status === 'lost') {
    return;
  }

  let board = cloneBoard(get(boardAtom));
  const cell = board[row]?.[col];
  if (!cell || cell.revealed || cell.flagged) {
    return;
  }

  if (stats.status === 'idle') {
    const generated = placeMinesExcludingClick(BEGINNER_CONFIG, row, col);
    board = generated.map((generatedRow, rowIndex) =>
      generatedRow.map((generatedCell, colIndex) => ({
        ...generatedCell,
        flagged: board[rowIndex][colIndex].flagged,
      })),
    );
  }

  set(boardAtom, revealWithFloodFill(board, row, col));
});

export const toggleFlagAtom = atom(null, (get, set, { row, col }: CellCoord) => {
  const stats = get(minesweeperStatsAtom);
  if (stats.status === 'won' || stats.status === 'lost') {
    return;
  }

  set(boardAtom, toggleFlag(cloneBoard(get(boardAtom)), row, col));
});
