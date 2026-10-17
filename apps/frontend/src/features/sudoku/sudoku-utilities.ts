import { atom } from "jotai";
import { createSudokuPuzzle } from "./sudoku-generator";
import {
  detectGridConflicts,
  findNextDeductionHint,
} from "./sudoku-solver";
import type {
  SudokuCell,
  SudokuDifficulty,
  SudokuGameState,
  SudokuGameStatus,
  SudokuHistorySnapshot,
} from "./sudoku-types";

const initialHintsCount = 3;

const cloneCells = (cells: SudokuCell[][]): SudokuCell[][] => {
  return cells.map((row) => {
    return row.map((cell) => {
      return {
        ...cell,
        notes: [...cell.notes],
      };
    });
  });
};

const createInitialState = (
  difficulty: SudokuDifficulty = "medium"
): SudokuGameState => {
  const { cells } = createSudokuPuzzle(difficulty);

  return {
    grid: cells,
    selectedCell: { row: 0, col: 0 },
    difficulty,
    isNotesMode: false,
    autoCheckConflicts: true,
    hintsRemaining: initialHintsCount,
    status: "playing",
    activeHint: null,
    history: [],
  };
};

// Jotai State Atoms
export const sudokuGameAtom = atom<SudokuGameState>(
  createInitialState("medium")
);

export const sudokuElapsedSecondsAtom = atom<number>(0);

export const sudokuNoticeAtom = atom<{
  title: string;
  message: string;
} | null>(null);

export interface SudokuStats {
  difficulty: SudokuDifficulty;
  status: SudokuGameStatus;
  hintsRemaining: number;
  isNotesMode: boolean;
  autoCheckConflicts: boolean;
  selectedCell: { row: number; col: number } | null;
  digitCounts: Record<number, number>;
  filledCount: number;
  correctCount: number;
  progressPercent: number;
  canUndo: boolean;
  hasWon: boolean;
  activeHint: SudokuGameState["activeHint"];
}

export const computeSudokuStats = (game: SudokuGameState): SudokuStats => {
  const digitCounts: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
  };

  let filledCount = 0;
  let correctCount = 0;

  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      const cell = game.grid[r][c];
      if (cell.value <= 0) {
        continue;
      }

      filledCount += 1;
      digitCounts[cell.value] = (digitCounts[cell.value] ?? 0) + 1;
      if (cell.value === cell.solution) {
        correctCount += 1;
      }
    }
  }

  const progressPercent = Math.round((correctCount / 81) * 100);

  return {
    difficulty: game.difficulty,
    status: game.status,
    hintsRemaining: game.hintsRemaining,
    isNotesMode: game.isNotesMode,
    autoCheckConflicts: game.autoCheckConflicts,
    selectedCell: game.selectedCell,
    digitCounts,
    filledCount,
    correctCount,
    progressPercent,
    canUndo: game.history.length > 0,
    hasWon: game.status === "won",
    activeHint: game.activeHint,
  };
};

// Action Atoms
export const startNewSudokuGameAtom = atom(
  null,
  (get, set, difficulty?: SudokuDifficulty) => {
    const current = get(sudokuGameAtom);
    const targetDifficulty = difficulty ?? current.difficulty;
    set(sudokuGameAtom, createInitialState(targetDifficulty));
    set(sudokuElapsedSecondsAtom, 0);
    set(sudokuNoticeAtom, null);
  }
);

export const restartCurrentSudokuAtom = atom(null, (get, set) => {
  const current = get(sudokuGameAtom);
  const resetCells = current.grid.map((row) => {
    return row.map((cell) => {
      return {
        ...cell,
        value: cell.isGiven ? cell.value : 0,
        notes: [],
        isError: false,
      };
    });
  });

  set(sudokuGameAtom, {
    ...current,
    grid: resetCells,
    status: "playing",
    activeHint: null,
    history: [],
  });
  set(sudokuElapsedSecondsAtom, 0);
  set(sudokuNoticeAtom, null);
});

export const selectSudokuCellAtom = atom(
  null,
  (get, set, position: { row: number; col: number } | null) => {
    const current = get(sudokuGameAtom);
    set(sudokuGameAtom, {
      ...current,
      selectedCell: position,
      activeHint: null,
    });
  }
);

export const toggleSudokuNotesModeAtom = atom(null, (get, set) => {
  const current = get(sudokuGameAtom);
  set(sudokuGameAtom, {
    ...current,
    isNotesMode: !current.isNotesMode,
  });
});

export const toggleSudokuAutoCheckAtom = atom(null, (get, set) => {
  const current = get(sudokuGameAtom);
  const isNextAuto = !current.autoCheckConflicts;
  const updatedGrid = cloneCells(current.grid);

  if (isNextAuto) {
    const conflicts = detectGridConflicts(updatedGrid);
    for (let r = 0; r < 9; r += 1) {
      for (let c = 0; c < 9; c += 1) {
        updatedGrid[r][c].isError = conflicts[r][c];
      }
    }
  } else {
    for (let r = 0; r < 9; r += 1) {
      for (let c = 0; c < 9; c += 1) {
        updatedGrid[r][c].isError = false;
      }
    }
  }

  set(sudokuGameAtom, {
    ...current,
    autoCheckConflicts: isNextAuto,
    grid: updatedGrid,
  });
});

const eliminatePeerCandidateNotes = (
  grid: SudokuCell[][],
  row: number,
  col: number,
  digit: number
): void => {
  const boxStartRow = Math.floor(row / 3) * 3;
  const boxStartCol = Math.floor(col / 3) * 3;

  for (let index = 0; index < 9; index += 1) {
    const rowNotes = grid[row][index].notes;
    const rowIndex = rowNotes.indexOf(digit);
    if (rowIndex !== -1) {
      rowNotes.splice(rowIndex, 1);
    }

    const colNotes = grid[index][col].notes;
    const colIndex = colNotes.indexOf(digit);
    if (colIndex !== -1) {
      colNotes.splice(colIndex, 1);
    }

    const boxRow = boxStartRow + Math.floor(index / 3);
    const boxCol = boxStartCol + (index % 3);
    const boxNotes = grid[boxRow][boxCol].notes;
    const boxIndex = boxNotes.indexOf(digit);
    if (boxIndex !== -1) {
      boxNotes.splice(boxIndex, 1);
    }
  }
};

const updateBoardConflicts = (
  grid: SudokuCell[][],
  isAutoCheck: boolean
): void => {
  const conflicts = detectGridConflicts(grid);
  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      if (!isAutoCheck) {
        grid[r][c].isError = conflicts[r][c];
      } else if (grid[r][c].value === grid[r][c].solution) {
        grid[r][c].isError = false;
      } else {
        grid[r][c].isError = conflicts[r][c] || grid[r][c].value > 0;
      }
    }
  }
};

const isValidSudokuDigit = (digit: number): boolean =>
  Number.isSafeInteger(digit) && digit >= 1 && digit <= 9;

export const placeSudokuDigitAtom = atom(
  null,
  (get, set, digit: number) => {
    const current = get(sudokuGameAtom);
    if (
      current.status !== "playing" ||
      !current.selectedCell ||
      !isValidSudokuDigit(digit)
    ) {
      return;
    }

    const { row, col } = current.selectedCell;
    const cell = current.grid[row][col];
    // Cannot overwrite initial clues
    if (cell.isGiven) {
      return;
    }

    const snapshot: SudokuHistorySnapshot = {
      grid: current.grid.map((r) => r.map((c) => c.value)),
      notes: current.grid.map((r) => r.map((c) => [...c.notes])),
    };

    const nextGrid = cloneCells(current.grid);
    const targetCell = nextGrid[row][col];

    if (current.isNotesMode) {
      const existingIndex = targetCell.notes.indexOf(digit);
      if (existingIndex === -1) {
        targetCell.notes.push(digit);
        targetCell.notes.sort((a, b) => a - b);
      } else {
        targetCell.notes.splice(existingIndex, 1);
      }

      set(sudokuGameAtom, {
        ...current,
        grid: nextGrid,
        history: [...current.history, snapshot],
        activeHint: null,
      });
      return;
    }

    if (targetCell.value === digit) {
      targetCell.value = 0;
      targetCell.isError = false;

      set(sudokuGameAtom, {
        ...current,
        grid: nextGrid,
        history: [...current.history, snapshot],
        activeHint: null,
      });
      return;
    }

    targetCell.value = digit;
    targetCell.notes = [];
    eliminatePeerCandidateNotes(nextGrid, row, col, digit);

    if (current.autoCheckConflicts) {
      targetCell.isError = digit !== targetCell.solution;
    }

    updateBoardConflicts(nextGrid, current.autoCheckConflicts);

    let nextStatus: SudokuGameStatus = current.status;
    const isWon = nextGrid.every((r) =>
      r.every((c) => c.value === c.solution)
    );
    if (isWon) {
      nextStatus = "won";
    }

    set(sudokuGameAtom, {
      ...current,
      grid: nextGrid,
      status: nextStatus,
      history: [...current.history, snapshot],
      activeHint: null,
    });
  }
);

export const clearSudokuCellAtom = atom(null, (get, set) => {
  const current = get(sudokuGameAtom);
  if (current.status !== "playing" || !current.selectedCell) {
    return;
  }

  const { row, col } = current.selectedCell;
  const cell = current.grid[row][col];
  if (cell.isGiven || (cell.value === 0 && cell.notes.length === 0)) {
    return;
  }

  const snapshot: SudokuHistorySnapshot = {
    grid: current.grid.map((r) => r.map((c) => c.value)),
    notes: current.grid.map((r) => r.map((c) => [...c.notes])),
  };

  const nextGrid = cloneCells(current.grid);
  nextGrid[row][col].value = 0;
  nextGrid[row][col].notes = [];
  nextGrid[row][col].isError = false;

  set(sudokuGameAtom, {
    ...current,
    grid: nextGrid,
    history: [...current.history, snapshot],
    activeHint: null,
  });
});

export const undoSudokuMoveAtom = atom(null, (get, set) => {
  const current = get(sudokuGameAtom);
  if (current.history.length === 0 || current.status === "won") {
    return;
  }

  const history = [...current.history];
  const lastSnapshot = history.pop();
  if (!lastSnapshot) {
    return;
  }

  const nextGrid = cloneCells(current.grid);
  for (let r = 0; r < 9; r += 1) {
    for (let c = 0; c < 9; c += 1) {
      if (nextGrid[r][c].isGiven) {
        continue;
      }

      nextGrid[r][c].value = lastSnapshot.grid[r][c];
      nextGrid[r][c].notes = [...lastSnapshot.notes[r][c]];
      nextGrid[r][c].isError =
        lastSnapshot.grid[r][c] > 0 &&
        lastSnapshot.grid[r][c] !== nextGrid[r][c].solution;
    }
  }

  set(sudokuGameAtom, {
    ...current,
    grid: nextGrid,
    history,
    activeHint: null,
    status: "playing",
  });
});

export const triggerSudokuHintAtom = atom(null, (get, set) => {
  const current = get(sudokuGameAtom);
  if (current.status !== "playing") {
    return;
  }

  if (current.hintsRemaining <= 0) {
    set(sudokuNoticeAtom, {
      title: "No Hints Remaining",
      message: "You've used all 3 hints for this puzzle. Solve the remaining cells using candidate notes!",
    });
    return;
  }

  const hint = findNextDeductionHint(current.grid);
  if (!hint) {
    set(sudokuNoticeAtom, {
      title: "All Solved!",
      message: "Every remaining cell is already deduced or complete.",
    });
    return;
  }

  set(sudokuGameAtom, {
    ...current,
    activeHint: hint,
    selectedCell: hint.targetCell,
    hintsRemaining: current.hintsRemaining - 1,
  });
});

export const applyHintValueAtom = atom(null, (get, set) => {
  const current = get(sudokuGameAtom);
  if (!current.activeHint) {
    return;
  }

  const { targetCell, targetValue } = current.activeHint;
  set(selectSudokuCellAtom, targetCell);
  set(placeSudokuDigitAtom, targetValue);
  set(sudokuGameAtom, (previous) => ({ ...previous, activeHint: null }));
});

export const dismissSudokuHintAtom = atom(null, (get, set) => {
  const current = get(sudokuGameAtom);
  set(sudokuGameAtom, {
    ...current,
    activeHint: null,
  });
});

export const toggleSudokuPauseAtom = atom(null, (get, set) => {
  const current = get(sudokuGameAtom);
  if (current.status === "won") {
    return;
  }

  set(sudokuGameAtom, {
    ...current,
    status: current.status === "playing" ? "paused" : "playing",
  });
});
