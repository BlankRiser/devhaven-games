"use client";

import {
  ArrowCounterClockwiseIcon,
  ArrowUUpLeftIcon,
  CheckCircleIcon,
  EraserIcon,
  LightbulbIcon,
  PauseIcon,
  PencilSimpleIcon,
  PlayIcon,
  SparkleIcon,
  TimerIcon,
  XIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FullscreenToggleButton } from "@/features/common/use-game-fullscreen";
import { cn } from "@/lib/utils";
import { sudokuDifficulties } from "./sudoku-types";
import type {
  SudokuCell,
  SudokuDifficulty,
  SudokuHint,
} from "./sudoku-types";
import type { KeyboardEvent } from "react";

interface SudokuCellViewProperties {
  readonly cell: SudokuCell;
  readonly isSelected: boolean;
  readonly isFocusable: boolean;
  readonly isPeer: boolean;
  readonly isSameDigit: boolean;
  readonly hintRole?: "target" | "unit" | "source";
  readonly onSelect: (row: number, col: number) => void;
}

const mutedTextClass = "text-muted-foreground";
const boldForegroundClass = "text-foreground font-bold";

const getCellBackgroundClass = (
  isSelected: boolean,
  isSameDigit: boolean,
  value: number,
  hintRole?: "target" | "unit" | "source",
  isPeer = false
): string => {
  if (isSelected) {
    return "bg-foreground/15 ring-2 ring-foreground ring-inset z-10";
  }
  if (isSameDigit && value > 0) {
    return "bg-accent/80 font-bold";
  }
  if (hintRole === "target") {
    return "bg-chart-3/30 ring-2 ring-chart-3 ring-inset";
  }
  if (hintRole === "source") {
    return "bg-primary/25 ring-1 ring-primary ring-inset";
  }
  if (hintRole === "unit") {
    return "bg-accent/40";
  }
  return isPeer ? "bg-secondary/40" : "bg-card hover:bg-secondary/30";
};

const getCellTextClass = (
  isError: boolean,
  isGiven: boolean,
  value: number
): string => {
  if (isError) {
    return "bg-destructive/20 text-destructive font-black";
  }
  if (isGiven) {
    return boldForegroundClass;
  }
  return value > 0 ? "text-primary font-bold dark:text-sky-400" : mutedTextClass;
};

const getNoteTextClass = (hasNote: boolean, isMatching: boolean): string => {
  if (!hasNote) {
    return "opacity-0";
  }
  return isMatching ? boldForegroundClass : mutedTextClass;
};

const SudokuCellContent = ({
  value,
  notes,
  isSameDigit,
}: {
  readonly value: number;
  readonly notes: number[];
  readonly isSameDigit: boolean;
}) => {
  if (value > 0) {
    return (
      <span className="font-heading text-lg leading-none sm:text-2xl lg:text-3xl">
        {value}
      </span>
    );
  }

  if (notes.length > 0) {
    const notesSet = new Set(notes);
    return (
      <div className="grid h-full w-full grid-cols-3 grid-rows-3 p-0.5 leading-none">
        {Array.from({ length: 9 }, (_, index) => {
          const digit = index + 1;
          const hasNote = notesSet.has(digit);
          const isNoteMatchingSelected = isSameDigit && digit === value;
          return (
            <span
              key={digit}
              className={cn(
                "grid place-items-center font-mono text-xs font-semibold leading-none",
                getNoteTextClass(hasNote, isNoteMatchingSelected)
              )}
            >
              {digit}
            </span>
          );
        })}
      </div>
    );
  }

  return null;
};

export const SudokuCellView = ({
  cell,
  isSelected,
  isFocusable,
  isPeer,
  isSameDigit,
  hintRole,
  onSelect,
}: SudokuCellViewProperties) => {
  const { row, col, value, isGiven, notes, isError } = cell;
  const buttonReference = useRef<HTMLButtonElement>(null);

  const isRightBlockBorder = col === 2 || col === 5;
  const isBottomBlockBorder = row === 2 || row === 5;

  useEffect(() => {
    if (isSelected) {
      buttonReference.current?.focus();
    }
  }, [isSelected]);

  const handleClick = () => {
    onSelect(row, col);
  };

  const handleFocus = () => {
    if (isSelected) {
      return;
    }
    onSelect(row, col);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== " ") {
      return;
    }
    event.preventDefault();
    onSelect(row, col);
  };

  const bgClass = getCellBackgroundClass(
    isSelected,
    isSameDigit,
    value,
    hintRole,
    isPeer
  );
  const textClass = getCellTextClass(isError, isGiven, value);

  return (
    <button
      ref={buttonReference}
      type="button"
      aria-label={`Row ${row + 1}, Column ${col + 1}${
        value > 0 ? `, Value ${value}` : ", Empty"
      }${isGiven ? ", Original clue" : ""}`}
      aria-pressed={isSelected}
      onClick={handleClick}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      tabIndex={isFocusable ? 0 : -1}
      className={cn(
        "relative flex aspect-square w-full select-none items-center justify-center border-r border-b text-center transition-colors outline-hidden",
        "border-border/60",
        isRightBlockBorder && "border-r-foreground/80 border-r-2",
        isBottomBlockBorder && "border-b-foreground/80 border-b-2",
        bgClass,
        textClass
      )}
    >
      <SudokuCellContent
        value={value}
        notes={notes}
        isSameDigit={isSameDigit}
      />
    </button>
  );
};

export const SudokuGrid = ({
  grid,
  selectedCell,
  activeHint,
  isPaused,
  onSelectCell,
}: {
  readonly grid: SudokuCell[][];
  readonly selectedCell: { row: number; col: number } | null;
  readonly activeHint: SudokuHint | null;
  readonly isPaused: boolean;
  readonly onSelectCell: (row: number, col: number) => void;
}) => {
  const selectedDigit = selectedCell
    ? grid[selectedCell.row][selectedCell.col].value
    : 0;

  return (
    <div
      role="grid"
      aria-label="Sudoku 9x9 Grid"
      className={cn(
        "border-foreground/80 bg-card relative mx-auto grid aspect-square w-full max-w-[460px] grid-cols-9 border-2 shadow-xl transition-all sm:max-w-[500px] lg:max-w-[540px]",
        isPaused && "filter blur-md select-none pointer-events-none"
      )}
    >
      {grid.map((row, r) => {
        return row.map((cell, c) => {
          const isSelected =
            selectedCell !== null &&
            selectedCell.row === r &&
            selectedCell.col === c;
          const isPeer =
            selectedCell !== null &&
            (selectedCell.row === r ||
              selectedCell.col === c ||
              cell.box === grid[selectedCell.row][selectedCell.col].box);
          const isSameDigit =
            selectedDigit > 0 &&
            (cell.value === selectedDigit ||
              (cell.value === 0 && cell.notes.includes(selectedDigit)));

          const hintMatch = activeHint?.highlightCells.find(
            (h) => h.row === r && h.col === c
          );

          const isCellFocusable =
            isSelected || (selectedCell === null && r === 0 && c === 0);

          return (
            <SudokuCellView
              key={`cell-${r}-${c}`}
              cell={cell}
              isSelected={isSelected}
              isFocusable={isCellFocusable}
              isPeer={isPeer}
              isSameDigit={isSameDigit}
              hintRole={hintMatch?.role}
              onSelect={onSelectCell}
            />
          );
        });
      })}
    </div>
  );
};

export const SudokuKeypad = ({
  digitCounts,
  isNotesMode,
  hintsRemaining,
  canUndo,
  onInputDigit,
  onClear,
  onToggleNotesMode,
  onHint,
  onUndo,
}: {
  readonly digitCounts: Record<number, number>;
  readonly isNotesMode: boolean;
  readonly hintsRemaining: number;
  readonly canUndo: boolean;
  readonly onInputDigit: (digit: number) => void;
  readonly onClear: () => void;
  readonly onToggleNotesMode: () => void;
  readonly onHint: () => void;
  readonly onUndo: () => void;
}) => {
  return (
    <div className="mx-auto flex w-full max-w-[540px] flex-col gap-2 select-none sm:gap-3">
      {/* 1-9 Digit Buttons with Remaining Count Badges */}
      <div className="grid grid-cols-9 gap-1 sm:gap-2">
        {Array.from({ length: 9 }, (_, index) => {
          const digit = index + 1;
          const placed = digitCounts[digit] ?? 0;
          const remaining = Math.max(0, 9 - placed);
          const isCompleted = remaining === 0;

          return (
            <button
              key={digit}
              type="button"
              disabled={isCompleted}
              onClick={() => {
                onInputDigit(digit);
              }}
              aria-label={`Enter digit ${digit}, ${remaining} remaining`}
              className={cn(
                "group relative flex flex-col items-center justify-center border py-1.5 transition-all outline-hidden active:scale-95 sm:py-2.5",
                isCompleted
                  ? "border-border/40 bg-secondary/20 text-muted-foreground/35 cursor-not-allowed border-dashed"
                  : "border-border bg-card text-foreground hover:border-foreground hover:bg-secondary/60 cursor-pointer shadow-xs"
              )}
            >
              <span className="font-heading text-lg font-bold sm:text-2xl">
                {digit}
              </span>
              <span
                className={cn(
                  "font-mono text-xs font-semibold leading-none",
                  isCompleted
                    ? "text-muted-foreground/30"
                    : "text-muted-foreground"
                )}
              >
                {isCompleted ? "✓" : remaining}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action Controls: Undo, Erase, Notes Mode, Hint */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canUndo}
          onClick={onUndo}
          aria-label="Undo last action (Shortcut: Z or Cmd+Z)"
          className="h-10 gap-1 text-xs"
        >
          <ArrowUUpLeftIcon className="size-4 shrink-0" />
          <span className="hidden sm:inline">Undo</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          aria-label="Erase selected cell (Shortcut: Delete / Backspace)"
          className="h-10 gap-1 text-xs"
        >
          <EraserIcon className="size-4 shrink-0" />
          <span className="hidden sm:inline">Erase</span>
        </Button>

        <Button
          variant={isNotesMode ? "default" : "outline"}
          size="sm"
          onClick={onToggleNotesMode}
          aria-label="Toggle Pencil Notes Mode (Shortcut: N)"
          className="relative h-10 gap-1 text-xs"
        >
          <PencilSimpleIcon
            className="size-4 shrink-0"
            weight={isNotesMode ? "fill" : "regular"}
          />
          <span className="hidden sm:inline">Notes</span>
          <span
            className={cn(
              "px-1 py-0.2 font-mono text-xs uppercase font-bold",
              isNotesMode
                ? "bg-background text-foreground"
                : "bg-secondary text-muted-foreground"
            )}
          >
            {isNotesMode ? "ON" : "OFF"}
          </span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onHint}
          aria-label="Get a logical rule hint (Shortcut: H)"
          className="h-10 gap-1 text-xs"
        >
          <LightbulbIcon className="text-chart-3 size-4 shrink-0" weight="fill" />
          <span className="hidden sm:inline">Hint</span>
          <span className="bg-chart-3/20 text-chart-3 px-1 py-0.2 font-mono text-xs font-bold">
            {hintsRemaining}
          </span>
        </Button>
      </div>
    </div>
  );
};

export const SudokuTopHud = ({
  difficulty,
  elapsedSeconds,
  isPaused,
  isFullscreen,
  onSelectDifficulty,
  onTogglePause,
  onRestart,
  onNewGame,
  onToggleFullscreen,
}: {
  readonly difficulty: SudokuDifficulty;
  readonly elapsedSeconds: number;
  readonly isPaused: boolean;
  readonly isFullscreen: boolean;
  readonly onSelectDifficulty: (diff: SudokuDifficulty) => void;
  readonly onTogglePause: () => void;
  readonly onRestart: () => void;
  readonly onNewGame: () => void;
  readonly onToggleFullscreen: () => void;
}) => {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="border-border bg-card z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 text-xs uppercase">
      {/* Left: Difficulty selector */}
      <div className="flex items-center gap-1">
        {sudokuDifficulties.map((preset) => {
          const isActive = difficulty === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                onSelectDifficulty(preset.id);
              }}
              aria-label={`Difficulty ${preset.label}: ${preset.description}`}
              className={cn(
                "h-7 border px-2.5 text-xs font-medium tracking-wider uppercase transition-colors",
                isActive
                  ? "border-foreground bg-foreground text-background font-bold"
                  : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Center: Prominent Timer Widget */}
      <div className="border-border bg-secondary/40 flex items-center gap-2 border px-3 py-1 shadow-xs">
        <span className="relative flex size-2">
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75",
              isPaused ? "bg-muted-foreground" : "animate-ping bg-emerald-400"
            )}
          />
          <span
            className={cn(
              "relative inline-flex size-2 rounded-full",
              isPaused ? "bg-muted-foreground" : "bg-emerald-500"
            )}
          />
        </span>
        <TimerIcon className="size-4 text-muted-foreground" />
        <span className="font-mono text-sm font-bold tracking-widest text-foreground">
          {formattedTime}
        </span>
        <button
          type="button"
          onClick={onTogglePause}
          aria-label={isPaused ? "Resume game timer" : "Pause game timer"}
          className="text-muted-foreground hover:text-foreground ml-1 transition-colors"
        >
          {isPaused ? (
            <PlayIcon className="size-3.5" weight="fill" />
          ) : (
            <PauseIcon className="size-3.5" weight="fill" />
          )}
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRestart}
          aria-label="Restart current puzzle"
          className="h-7 gap-1 px-2.5 text-xs"
        >
          <ArrowCounterClockwiseIcon className="size-3.5" />
          <span>Restart</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onNewGame}
          aria-label="Deal a fresh puzzle"
          className="h-7 gap-1 px-2.5 text-xs"
        >
          <SparkleIcon className="size-3.5" />
          <span>New Puzzle</span>
        </Button>

        <FullscreenToggleButton
          isFullscreen={isFullscreen}
          onToggle={onToggleFullscreen}
        />
      </div>
    </div>
  );
};

export const SudokuHintBanner = ({
  hint,
  onApply,
  onDismiss,
}: {
  readonly hint: SudokuHint;
  readonly onApply: () => void;
  readonly onDismiss: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.16 }}
      className="border-chart-3/50 bg-chart-3/10 z-20 shrink-0 border-b px-4 py-2.5 shadow-sm"
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <LightbulbIcon className="text-chart-3 mt-0.5 size-4 shrink-0" weight="fill" />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-heading text-xs font-bold uppercase tracking-wider">
                {hint.ruleName}
              </span>
              <span className="bg-chart-3/20 text-chart-3 px-1.5 py-0.2 font-mono text-xs uppercase font-bold">
                {hint.category}
              </span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {hint.explanation}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onApply}
            className="h-7 text-xs font-semibold"
          >
            Apply ({hint.targetValue})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            aria-label="Dismiss hint"
            className="h-7 px-2 text-xs"
          >
            <XIcon className="size-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export const SudokuVictoryDialog = ({
  open,
  elapsedSeconds,
  difficulty,
  onPlayAgain,
}: {
  readonly open: boolean;
  readonly elapsedSeconds: number;
  readonly difficulty: SudokuDifficulty;
  readonly onPlayAgain: () => void;
}) => {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <AnimatePresence>
      {open ? (
        <dialog
          open
          aria-modal="true"
          aria-labelledby="sudoku-victory-title"
          className="fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center bg-black/75 p-4 backdrop-blur-xs border-0"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="border-foreground bg-card text-card-foreground flex max-w-sm flex-col items-center gap-4 border p-6 text-center shadow-2xl"
          >
            <div className="bg-emerald-500/15 text-emerald-500 flex size-14 items-center justify-center border border-emerald-500/30">
              <CheckCircleIcon className="size-8" weight="fill" />
            </div>

            <div className="flex flex-col gap-1">
              <h2
                id="sudoku-victory-title"
                className="font-heading text-2xl font-bold uppercase tracking-tight"
              >
                Sudoku Solved!
              </h2>
              <span className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
                Difficulty: {difficulty}
              </span>
            </div>

            <div className="border-border bg-secondary/30 flex w-full flex-col items-center justify-center gap-1 border p-4 text-center">
              <span className="text-muted-foreground text-xs uppercase tracking-wider">
                Completion Time
              </span>
              <span className="font-mono text-3xl font-bold text-foreground tracking-tight">
                {formattedTime}
              </span>
            </div>

            <Button
              className="w-full text-xs font-bold uppercase tracking-wider"
              onClick={onPlayAgain}
            >
              Play Next Puzzle
            </Button>
          </motion.div>
        </dialog>
      ) : null}
    </AnimatePresence>
  );
};
