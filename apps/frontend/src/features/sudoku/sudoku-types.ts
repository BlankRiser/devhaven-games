export type SudokuDifficulty = "easy" | "medium" | "hard" | "expert";

export interface SudokuCell {
  row: number;
  col: number;
  box: number;
  /**
   * 0 for empty, 1..9 for placed number
   */
  value: number;
  /**
   * 1..9 correct solution digit
   */
  solution: number;
  /**
   * Original puzzle clue (immutable)
   */
  isGiven: boolean;
  /**
   * Candidate pencil notes (1..9)
   */
  notes: number[];
  /**
   * Direct conflict in row, col, or box
   */
  isError: boolean;
}

export type SudokuRuleCategory = "gentle" | "moderate" | "tough";

export interface SudokuHint {
  ruleName: string;
  category: SudokuRuleCategory;
  targetCell: { row: number; col: number };
  targetValue: number;
  explanation: string;
  highlightCells: {
    row: number;
    col: number;
    role: "target" | "unit" | "source";
  }[];
}

export interface SudokuHistorySnapshot {
  /**
   * 9x9 numbers
   */
  grid: number[][];
  /**
   * 9x9 arrays of notes
   */
  notes: number[][][];
}

export type SudokuGameStatus = "playing" | "paused" | "won";

export interface SudokuGameState {
  grid: SudokuCell[][];
  selectedCell: { row: number; col: number } | null;
  difficulty: SudokuDifficulty;
  isNotesMode: boolean;
  autoCheckConflicts: boolean;
  hintsRemaining: number;
  status: SudokuGameStatus;
  activeHint: SudokuHint | null;
  history: SudokuHistorySnapshot[];
}

export interface DifficultyPreset {
  id: SudokuDifficulty;
  label: string;
  description: string;
  cluesRange: string;
  badgeColor: string;
}

export const sudokuDifficulties: readonly DifficultyPreset[] = [
  {
    id: "easy",
    label: "Easy",
    description: "Solvable using Naked & Hidden Singles (Only Choice & Only Square rules).",
    cluesRange: "38–44 clues",
    badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  {
    id: "medium",
    label: "Medium",
    description: "Requires Pointing Pairs and Naked Twins (Shared Subgroup & Naked Pair rules).",
    cluesRange: "32–36 clues",
    badgeColor: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  },
  {
    id: "hard",
    label: "Hard",
    description: "Requires Hidden Pairs, Box-Line reductions, and multi-step deduction.",
    cluesRange: "28–31 clues",
    badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  {
    id: "expert",
    label: "Expert",
    description: "Minimal clues near the theoretical limit requiring deep candidate logic.",
    cluesRange: "24–27 clues",
    badgeColor: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  },
] as const;
