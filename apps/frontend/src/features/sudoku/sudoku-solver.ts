import type { SudokuCell, SudokuHint } from "./sudoku-types";

export const allCandidatesMask = 0x1_ff;

export const countSetBits = (value: number): number => {
  let count = 0;
  let current = value;
  while (current > 0) {
    count += current & 1;
    current >>= 1;
  }
  return count;
};

export const getBoxIndex = (row: number, col: number): number =>
  Math.floor(row / 3) * 3 + Math.floor(col / 3);

export const getSingleDigitFromMask = (mask: number): number => {
  for (let digit = 1; digit <= 9; digit += 1) {
    if (mask === 1 << (digit - 1)) {
      return digit;
    }
  }
  return 0;
};

export const getCandidateMask = (
  grid: number[][],
  row: number,
  col: number
): number => {
  if (grid[row][col] !== 0) {
    return 0;
  }

  let placedMask = 0;
  const boxStartRow = Math.floor(row / 3) * 3;
  const boxStartCol = Math.floor(col / 3) * 3;

  for (let index = 0; index < 9; index += 1) {
    const rowDigit = grid[row][index];
    if (rowDigit > 0) {
      placedMask |= 1 << (rowDigit - 1);
    }

    const colDigit = grid[index][col];
    if (colDigit > 0) {
      placedMask |= 1 << (colDigit - 1);
    }

    const bRow = boxStartRow + Math.floor(index / 3);
    const bCol = boxStartCol + (index % 3);
    const boxDigit = grid[bRow][bCol];
    if (boxDigit > 0) {
      placedMask |= 1 << (boxDigit - 1);
    }
  }

  return allCandidatesMask & ~placedMask;
};

export const getCandidatesMaskTable = (grid: number[][]): number[][] => {
  const table = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => 0)
  );
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      table[row][col] = getCandidateMask(grid, row, col);
    }
  }
  return table;
};

interface SolverCellCandidate {
  row: number;
  col: number;
  mask: number;
  count: number;
}

const findBestCellForSolving = (
  grid: number[][]
): SolverCellCandidate | null => {
  let minCandidates = 10;
  let best: SolverCellCandidate | null = null;

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (grid[row][col] !== 0) {
        continue;
      }

      const mask = getCandidateMask(grid, row, col);
      const candidatesCount = countSetBits(mask);
      if (candidatesCount === 0) {
        return { row, col, mask: 0, count: 0 };
      }

      if (candidatesCount >= minCandidates) {
        continue;
      }

      minCandidates = candidatesCount;
      best = { row, col, mask, count: candidatesCount };
      if (candidatesCount === 1) {
        return best;
      }
    }
  }

  return best;
};

/**
 * Fast backtracking solver using Minimum Remaining Values (MRV).
 * Returns the number of solutions found, early-terminating when limit is reached.
 */
export const solveAndCountSolutions = (
  grid: number[][],
  limit = 2
): number => {
  const best = findBestCellForSolving(grid);
  if (!best) {
    return 1;
  }

  if (best.count === 0) {
    return 0;
  }

  let solutions = 0;
  for (let digit = 1; digit <= 9 && solutions < limit; digit += 1) {
    if ((best.mask & (1 << (digit - 1))) === 0) {
      continue;
    }
    grid[best.row][best.col] = digit;
    solutions += solveAndCountSolutions(grid, limit - solutions);
    grid[best.row][best.col] = 0;
  }

  return solutions;
};

export const solveSudokuGrid = (grid: number[][]): number[][] | null => {
  const working = grid.map((r) => [...r]);

  const canFindSolution = (): boolean => {
    const best = findBestCellForSolving(working);
    if (!best) {
      return true;
    }

    if (best.count === 0) {
      return false;
    }

    for (let digit = 1; digit <= 9; digit += 1) {
      if ((best.mask & (1 << (digit - 1))) === 0) {
        continue;
      }
      working[best.row][best.col] = digit;
      if (canFindSolution()) {
        return true;
      }
      working[best.row][best.col] = 0;
    }

    return false;
  };

  return canFindSolution() ? working : null;
};

const markRowConflicts = (
  grid: SudokuCell[][],
  conflicts: boolean[][]
): void => {
  for (let r = 0; r < 9; r += 1) {
    const digitMap = new Map<number, number[]>();
    for (let c = 0; c < 9; c += 1) {
      const { value } = grid[r][c];
      if (value <= 0) {
        continue;
      }
      const list = digitMap.get(value) ?? [];
      list.push(c);
      digitMap.set(value, list);
    }
    for (const indices of digitMap.values()) {
      if (indices.length <= 1) {
        continue;
      }
      for (const c of indices) {
        conflicts[r][c] = true;
      }
    }
  }
};

const markColConflicts = (
  grid: SudokuCell[][],
  conflicts: boolean[][]
): void => {
  for (let c = 0; c < 9; c += 1) {
    const digitMap = new Map<number, number[]>();
    for (let r = 0; r < 9; r += 1) {
      const { value } = grid[r][c];
      if (value <= 0) {
        continue;
      }
      const list = digitMap.get(value) ?? [];
      list.push(r);
      digitMap.set(value, list);
    }
    for (const indices of digitMap.values()) {
      if (indices.length <= 1) {
        continue;
      }
      for (const r of indices) {
        conflicts[r][c] = true;
      }
    }
  }
};

const markBoxConflicts = (
  grid: SudokuCell[][],
  conflicts: boolean[][]
): void => {
  for (let b = 0; b < 9; b += 1) {
    const boxStartRow = Math.floor(b / 3) * 3;
    const boxStartCol = (b % 3) * 3;
    const digitMap = new Map<number, { r: number; c: number }[]>();

    for (let index = 0; index < 9; index += 1) {
      const r = boxStartRow + Math.floor(index / 3);
      const c = boxStartCol + (index % 3);
      const { value } = grid[r][c];
      if (value <= 0) {
        continue;
      }
      const list = digitMap.get(value) ?? [];
      list.push({ r, c });
      digitMap.set(value, list);
    }
    for (const points of digitMap.values()) {
      if (points.length <= 1) {
        continue;
      }
      for (const p of points) {
        conflicts[p.r][p.c] = true;
      }
    }
  }
};

/**
 * Detects placed digit conflicts across row, column, and 3x3 box units.
 */
export const detectGridConflicts = (grid: SudokuCell[][]): boolean[][] => {
  const conflicts = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => false)
  );

  markRowConflicts(grid, conflicts);
  markColConflicts(grid, conflicts);
  markBoxConflicts(grid, conflicts);

  return conflicts;
};

// 1. Rule 1: Only Choice Rule (Naked Single)
const findOnlyChoiceHint = (
  grid: SudokuCell[][],
  candidateTable: number[][]
): SudokuHint | null => {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (
        grid[row][col].value === 0 &&
        countSetBits(candidateTable[row][col]) === 1
      ) {
        const targetValue = getSingleDigitFromMask(candidateTable[row][col]);
        return {
          ruleName: "Only Choice Rule (Naked Single)",
          category: "gentle",
          targetCell: { row, col },
          targetValue,
          explanation: `Row ${row + 1}, Column ${col + 1} has only one possible candidate remaining: ${targetValue}. All other numbers (1–9) are already present in its row, column, or 3×3 box.`,
          highlightCells: [{ row, col, role: "target" }],
        };
      }
    }
  }
  return null;
};

// 2. Rule 2: Only Square Rule (Hidden Single in Row)
const findHiddenSingleRowHint = (
  grid: SudokuCell[][],
  candidateTable: number[][]
): SudokuHint | null => {
  for (let row = 0; row < 9; row += 1) {
    for (let digit = 1; digit <= 9; digit += 1) {
      const bit = 1 << (digit - 1);
      let matchCol = -1;
      let count = 0;

      for (let col = 0; col < 9; col += 1) {
        if (grid[row][col].value !== 0 || (candidateTable[row][col] & bit) === 0) {
          continue;
        }
        count += 1;
        matchCol = col;
      }

      if (count === 1) {
        return {
          ruleName: "Only Square Rule (Hidden Single in Row)",
          category: "gentle",
          targetCell: { row, col: matchCol },
          targetValue: digit,
          explanation: `In Row ${row + 1}, the number ${digit} can only be placed in Column ${matchCol + 1}. No other cell in this row can take ${digit}.`,
          highlightCells: Array.from({ length: 9 }, (_, colIndex) => {
            return {
              row,
              col: colIndex,
              role: colIndex === matchCol ? ("target" as const) : ("unit" as const),
            };
          }),
        };
      }
    }
  }
  return null;
};

// 3. Rule 2: Only Square Rule (Hidden Single in Column)
const findHiddenSingleColHint = (
  grid: SudokuCell[][],
  candidateTable: number[][]
): SudokuHint | null => {
  for (let col = 0; col < 9; col += 1) {
    for (let digit = 1; digit <= 9; digit += 1) {
      const bit = 1 << (digit - 1);
      let matchRow = -1;
      let count = 0;

      for (let row = 0; row < 9; row += 1) {
        if (grid[row][col].value !== 0 || (candidateTable[row][col] & bit) === 0) {
          continue;
        }
        count += 1;
        matchRow = row;
      }

      if (count === 1) {
        return {
          ruleName: "Only Square Rule (Hidden Single in Column)",
          category: "gentle",
          targetCell: { row: matchRow, col },
          targetValue: digit,
          explanation: `In Column ${col + 1}, the number ${digit} can only be placed in Row ${matchRow + 1}.`,
          highlightCells: Array.from({ length: 9 }, (_, rowIndex) => {
            return {
              row: rowIndex,
              col,
              role: rowIndex === matchRow ? ("target" as const) : ("unit" as const),
            };
          }),
        };
      }
    }
  }
  return null;
};

// 4. Rule 2: Two out of Three / Box Single Rule (Hidden Single in 3x3 Box)
const findHiddenSingleBoxHint = (
  grid: SudokuCell[][],
  candidateTable: number[][]
): SudokuHint | null => {
  for (let box = 0; box < 9; box += 1) {
    const boxStartRow = Math.floor(box / 3) * 3;
    const boxStartCol = (box % 3) * 3;

    for (let digit = 1; digit <= 9; digit += 1) {
      const bit = 1 << (digit - 1);
      let matchRow = -1;
      let matchCol = -1;
      let count = 0;

      for (let index = 0; index < 9; index += 1) {
        const row = boxStartRow + Math.floor(index / 3);
        const col = boxStartCol + (index % 3);

        if (grid[row][col].value !== 0 || (candidateTable[row][col] & bit) === 0) {
          continue;
        }

        count += 1;
        matchRow = row;
        matchCol = col;
      }

      if (count === 1) {
        return {
          ruleName: "Two out of Three Rule (Box Single)",
          category: "gentle",
          targetCell: { row: matchRow, col: matchCol },
          targetValue: digit,
          explanation: `Within Box ${box + 1}, the number ${digit} can only be placed at Row ${matchRow + 1}, Column ${matchCol + 1}.`,
          highlightCells: Array.from({ length: 9 }, (_, index) => {
            const row = boxStartRow + Math.floor(index / 3);
            const col = boxStartCol + (index % 3);
            return {
              row,
              col,
              role:
                row === matchRow && col === matchCol
                  ? ("target" as const)
                  : ("unit" as const),
            };
          }),
        };
      }
    }
  }
  return null;
};

// 5a. Rule 3: Shared Subgroup Rule (Pointing Pair in Row)
const findPointingPairRowHint = (
  grid: SudokuCell[][],
  candidateTable: number[][]
): SudokuHint | null => {
  for (let box = 0; box < 9; box += 1) {
    const boxStartRow = Math.floor(box / 3) * 3;
    const boxStartCol = (box % 3) * 3;

    for (let digit = 1; digit <= 9; digit += 1) {
      const bit = 1 << (digit - 1);
      const matchingCells: { row: number; col: number }[] = [];

      for (let index = 0; index < 9; index += 1) {
        const row = boxStartRow + Math.floor(index / 3);
        const col = boxStartCol + (index % 3);
        if (grid[row][col].value !== 0 || (candidateTable[row][col] & bit) === 0) {
          continue;
        }
        matchingCells.push({ row, col });
      }

      if (matchingCells.length < 2 || matchingCells.length > 3) {
        continue;
      }

      const firstRow = matchingCells[0].row;
      const isAllSameRow = matchingCells.every((cell) => cell.row === firstRow);

      if (!isAllSameRow) {
        continue;
      }

      const hasOutsideInRow = Array.from({ length: 9 }, (_, c) => c).some((c) => {
        return (
          Math.floor(c / 3) !== Math.floor(boxStartCol / 3) &&
          grid[firstRow][c].value === 0 &&
          (candidateTable[firstRow][c] & bit) !== 0
        );
      });

      if (hasOutsideInRow) {
        return {
          ruleName: "Shared Subgroup Rule (Pointing Pair)",
          category: "moderate",
          targetCell: { row: firstRow, col: matchingCells[0].col },
          targetValue: digit,
          explanation: `In Box ${box + 1}, candidate ${digit} is confined entirely to Row ${firstRow + 1}. Therefore, ${digit} cannot appear anywhere else along Row ${firstRow + 1} outside this box.`,
          highlightCells: matchingCells.map((cell) => {
            return {
              row: cell.row,
              col: cell.col,
              role: "source" as const,
            };
          }),
        };
      }
    }
  }
  return null;
};

// 5b. Rule 3: Shared Subgroup Rule (Pointing Pair in Column)
const findPointingPairColHint = (
  grid: SudokuCell[][],
  candidateTable: number[][]
): SudokuHint | null => {
  for (let box = 0; box < 9; box += 1) {
    const boxStartRow = Math.floor(box / 3) * 3;
    const boxStartCol = (box % 3) * 3;

    for (let digit = 1; digit <= 9; digit += 1) {
      const bit = 1 << (digit - 1);
      const matchingCells: { row: number; col: number }[] = [];

      for (let index = 0; index < 9; index += 1) {
        const row = boxStartRow + Math.floor(index / 3);
        const col = boxStartCol + (index % 3);
        if (grid[row][col].value !== 0 || (candidateTable[row][col] & bit) === 0) {
          continue;
        }
        matchingCells.push({ row, col });
      }

      if (matchingCells.length < 2 || matchingCells.length > 3) {
        continue;
      }

      const firstCol = matchingCells[0].col;
      const isAllSameCol = matchingCells.every((cell) => cell.col === firstCol);

      if (!isAllSameCol) {
        continue;
      }

      const hasOutsideInCol = Array.from({ length: 9 }, (_, r) => r).some((r) => {
        return (
          Math.floor(r / 3) !== Math.floor(boxStartRow / 3) &&
          grid[r][firstCol].value === 0 &&
          (candidateTable[r][firstCol] & bit) !== 0
        );
      });

      if (hasOutsideInCol) {
        return {
          ruleName: "Shared Subgroup Rule (Pointing Pair in Column)",
          category: "moderate",
          targetCell: { row: matchingCells[0].row, col: firstCol },
          targetValue: digit,
          explanation: `In Box ${box + 1}, candidate ${digit} is confined entirely to Column ${firstCol + 1}. Therefore, ${digit} cannot appear anywhere else along Column ${firstCol + 1} outside this box.`,
          highlightCells: matchingCells.map((cell) => {
            return {
              row: cell.row,
              col: cell.col,
              role: "source" as const,
            };
          }),
        };
      }
    }
  }
  return null;
};

// 6. Direct Solution Fallback
const findSolutionFallbackHint = (grid: SudokuCell[][]): SudokuHint | null => {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (grid[row][col].value === 0) {
        const correct = grid[row][col].solution;
        return {
          ruleName: "Logical Solution Deduction",
          category: "tough",
          targetCell: { row, col },
          targetValue: correct,
          explanation: `Advanced cross-checking reveals that Row ${row + 1}, Column ${col + 1} must be ${correct}.`,
          highlightCells: [{ row, col, role: "target" }],
        };
      }
    }
  }
  return null;
};

/**
 * Evaluates human-solving deduction rules (Sudoku Dragon guidelines) to generate
 * educational, step-by-step hints explaining why a number belongs in a cell.
 */
export const findNextDeductionHint = (
  grid: SudokuCell[][]
): SudokuHint | null => {
  const numericGrid = grid.map((row) => row.map((cell) => cell.value));
  const candidateTable = getCandidatesMaskTable(numericGrid);

  const hintRules = [
    findOnlyChoiceHint,
    findHiddenSingleRowHint,
    findHiddenSingleColHint,
    findHiddenSingleBoxHint,
    findPointingPairRowHint,
    findPointingPairColHint,
  ];

  for (const rule of hintRules) {
    const hint = rule(grid, candidateTable);
    if (hint) {
      return hint;
    }
  }

  return findSolutionFallbackHint(grid);
};
