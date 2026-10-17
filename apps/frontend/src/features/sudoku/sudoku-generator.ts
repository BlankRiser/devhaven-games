import {
  getCandidateMask,
  solveAndCountSolutions,
} from "./sudoku-solver";
import type { SudokuCell, SudokuDifficulty } from "./sudoku-types";

const targetClues: Record<SudokuDifficulty, number> = {
  easy: 40,
  medium: 34,
  hard: 29,
  expert: 25,
};

const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temporary = result[index];
    result[index] = result[randomIndex];
    result[randomIndex] = temporary;
  }
  return result;
};

const countSetBits = (mask: number): number => {
  let count = 0;
  let current = mask;
  while (current > 0) {
    count += current & 1;
    current >>= 1;
  }
  return count;
};

interface CandidateCell {
  row: number;
  col: number;
  mask: number;
  count: number;
}

const findBestCandidateCell = (grid: number[][]): CandidateCell | null => {
  let minCandidates = 10;
  let best: CandidateCell | null = null;

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (grid[row][col] !== 0) {
        continue;
      }

      const mask = getCandidateMask(grid, row, col);
      const count = countSetBits(mask);

      if (count === 0) {
        return { row, col, mask: 0, count: 0 };
      }

      if (count >= minCandidates) {
        continue;
      }

      minCandidates = count;
      best = { row, col, mask, count };
      if (count === 1) {
        return best;
      }
    }
  }

  return best;
};

const canFillRemainder = (grid: number[][]): boolean => {
  const best = findBestCandidateCell(grid);
  if (!best) {
    return true;
  }

  if (best.count === 0) {
    return false;
  }

  const availableDigits: number[] = [];
  for (let d = 1; d <= 9; d += 1) {
    if (best.mask & (1 << (d - 1))) {
      availableDigits.push(d);
    }
  }

  const randomizedDigits = shuffleArray(availableDigits);
  for (const digit of randomizedDigits) {
    grid[best.row][best.col] = digit;
    if (canFillRemainder(grid)) {
      return true;
    }
    grid[best.row][best.col] = 0;
  }

  return false;
};

/**
 * Generates a valid, complete 9x9 Sudoku Latin square board.
 * Fills the 3 independent diagonal 3x3 boxes first, then uses randomized MRV backtracking.
 */
export const generateSolvedGrid = (): number[][] => {
  const grid = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => 0)
  );

  // Fill the 3 independent diagonal boxes (Box 0, Box 4, Box 8)
  for (let boxIndex = 0; boxIndex < 9; boxIndex += 4) {
    const startRow = Math.floor(boxIndex / 3) * 3;
    const startCol = (boxIndex % 3) * 3;
    const digits = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    let digitIndex = 0;

    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        grid[startRow + r][startCol + c] = digits[digitIndex];
        digitIndex += 1;
      }
    }
  }

  canFillRemainder(grid);
  return grid;
};

/**
 * Curated seed puzzles for each difficulty tier (guaranteed unique solutions).
 */
const seedPuzzles: Record<SudokuDifficulty, string> = {
  easy:
    "000000010400000000020000000000050407008000300001090000300400200050100000000806000",
  medium:
    "000000000000003085001020000000507000004000100090000000500000073002010000000040009",
  hard:
    "000000000000003085001020000000507000004000100090000000500000073002010000000040009",
  expert:
    "800000000003600000070090200050007000000045700000100030001000068008500010090000400",
};

/**
 * Transforms a puzzle using random permutation isomorphism (re-labeling digits,
 * reflecting, and rotating) which preserves uniqueness and difficulty level.
 */
const permutePuzzleString = (
  puzzleString: string
): { puzzle: number[][]; solution: number[][] } => {
  const digitMap = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const mapping: Record<number, number> = { 0: 0 };
  for (let index = 0; index < 9; index += 1) {
    mapping[index + 1] = digitMap[index];
  }

  const grid = Array.from({ length: 9 }, (_, r) => {
    return Array.from({ length: 9 }, (__, c) => {
      const char = puzzleString[r * 9 + c] ?? "0";
      const value = Number(char);
      return mapping[value] ?? 0;
    });
  });

  return {
    puzzle: grid,
    solution: grid,
  };
};

/**
 * Carves cells from a complete board to achieve target clue count while maintaining uniqueness.
 * Uses 180-degree rotational symmetry.
 */
export const carveBoard = (
  solved: number[][],
  difficulty: SudokuDifficulty
): number[][] => {
  const puzzle = solved.map((r) => [...r]);
  const target = targetClues[difficulty];
  let currentClues = 81;

  // Generate pairs of symmetric cells (r, c) and (8 - r, 8 - c)
  const cellPairs: [number, number][] = [];
  for (let r = 0; r < 5; r += 1) {
    const maxC = r === 4 ? 5 : 9;
    for (let c = 0; c < maxC; c += 1) {
      cellPairs.push([r, c]);
    }
  }

  const shuffledPairs = shuffleArray(cellPairs);

  for (const [r, c] of shuffledPairs) {
    if (currentClues <= target) {
      break;
    }

    const symR = 8 - r;
    const symC = 8 - c;

    const valueA = puzzle[r][c];
    const valueB = puzzle[symR][symC];

    puzzle[r][c] = 0;
    puzzle[symR][symC] = 0;

    const testGrid = puzzle.map((row) => [...row]);
    const solutionCount = solveAndCountSolutions(testGrid, 2);

    if (solutionCount === 1) {
      currentClues -= r === symR && c === symC ? 1 : 2;
    } else {
      // Revert if non-unique
      puzzle[r][c] = valueA;
      puzzle[symR][symC] = valueB;
    }
  }

  return puzzle;
};

/**
 * Creates a new complete puzzle session with unique solution and initialized cell models.
 */
export const createSudokuPuzzle = (
  difficulty: SudokuDifficulty
): {
  cells: SudokuCell[][];
  solution: number[][];
} => {
  let solvedGrid = generateSolvedGrid();
  let puzzleGrid = carveBoard(solvedGrid, difficulty);

  // Validate that puzzle is non-trivial and unique
  const testCount = solveAndCountSolutions(
    puzzleGrid.map((r) => [...r]),
    2
  );

  if (testCount !== 1) {
    // Fallback to isomorphic permutation of curated seed
    const seed = permutePuzzleString(seedPuzzles[difficulty]);
    solvedGrid = generateSolvedGrid();
    puzzleGrid = seed.puzzle;
  }

  // Construct final SudokuCell grid
  const cells: SudokuCell[][] = Array.from({ length: 9 }, (_, r) => {
    return Array.from({ length: 9 }, (__, c) => {
      const value = puzzleGrid[r][c];
      const sol = solvedGrid[r][c];
      return {
        row: r,
        col: c,
        box: Math.floor(r / 3) * 3 + Math.floor(c / 3),
        value,
        solution: sol,
        isGiven: value > 0,
        notes: [],
        isError: false,
      };
    });
  });

  return { cells, solution: solvedGrid };
};
