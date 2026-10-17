"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useGameFullscreen } from "@/features/common/use-game-fullscreen";
import {
  SudokuGrid,
  SudokuHintBanner,
  SudokuKeypad,
  SudokuTopHud,
  SudokuVictoryDialog,
} from "./sudoku-assets";
import {
  applyHintValueAtom,
  clearSudokuCellAtom,
  computeSudokuStats,
  dismissSudokuHintAtom,
  placeSudokuDigitAtom,
  restartCurrentSudokuAtom,
  selectSudokuCellAtom,
  startNewSudokuGameAtom,
  sudokuElapsedSecondsAtom,
  sudokuGameAtom,
  sudokuNoticeAtom,
  toggleSudokuNotesModeAtom,
  toggleSudokuPauseAtom,
  triggerSudokuHintAtom,
  undoSudokuMoveAtom,
} from "./sudoku-utilities";
import type { SudokuDifficulty } from "./sudoku-types";

interface KeyboardActions {
  selectCell: (pos: { row: number; col: number } | null) => void;
  inputDigit: (digit: number) => void;
  clearCell: () => void;
  toggleNotesMode: () => void;
  triggerHint: () => void;
  dismissHint: () => void;
  togglePause: () => void;
}

const didHandleNavigationKey = (
  key: string,
  hasShiftKey: boolean,
  current: { row: number; col: number } | null,
  selectCell: (pos: { row: number; col: number }) => void
): boolean => {
  if (key === "tab") {
    if (!current) {
      selectCell({ row: 0, col: 0 });
      return true;
    }

    if (hasShiftKey) {
      const nextCol = current.col - 1;
      if (nextCol < 0) {
        selectCell({ row: (current.row + 8) % 9, col: 8 });
      } else {
        selectCell({ row: current.row, col: nextCol });
      }
    } else {
      const nextCol = current.col + 1;
      if (nextCol > 8) {
        selectCell({ row: (current.row + 1) % 9, col: 0 });
      } else {
        selectCell({ row: current.row, col: nextCol });
      }
    }
    return true;
  }

  if (key === "enter") {
    if (!current) {
      selectCell({ row: 0, col: 0 });
      return true;
    }

    if (hasShiftKey) {
      const nextRow = current.row - 1;
      if (nextRow < 0) {
        selectCell({ row: 8, col: (current.col + 8) % 9 });
      } else {
        selectCell({ row: nextRow, col: current.col });
      }
    } else {
      const nextRow = current.row + 1;
      if (nextRow > 8) {
        selectCell({ row: 0, col: (current.col + 1) % 9 });
      } else {
        selectCell({ row: nextRow, col: current.col });
      }
    }
    return true;
  }

  const activePosition = current ?? { row: 0, col: 0 };
  if (key === "arrowup" || key === "w") {
    selectCell({ row: (activePosition.row + 8) % 9, col: activePosition.col });
    return true;
  }
  if (key === "arrowdown" || key === "s") {
    selectCell({ row: (activePosition.row + 1) % 9, col: activePosition.col });
    return true;
  }
  if (key === "arrowleft" || key === "a") {
    selectCell({ row: activePosition.row, col: (activePosition.col + 8) % 9 });
    return true;
  }
  if (key === "arrowright" || key === "d") {
    selectCell({ row: activePosition.row, col: (activePosition.col + 1) % 9 });
    return true;
  }

  return false;
};

const didHandleActionKey = (key: string, actions: KeyboardActions): boolean => {
  if (["backspace", "delete", "0"].includes(key)) {
    actions.clearCell();
    return true;
  }
  if (key === "n") {
    actions.toggleNotesMode();
    return true;
  }
  if (key === "h") {
    actions.triggerHint();
    return true;
  }
  if (key === "p") {
    actions.togglePause();
    return true;
  }
  if (key === "escape") {
    actions.dismissHint();
    actions.selectCell(null);
    return true;
  }
  return false;
};

const Sudoku = () => {
  const { containerRef, isFullscreen, toggleFullscreen } = useGameFullscreen();

  const game = useAtomValue(sudokuGameAtom);
  const stats = useMemo(() => computeSudokuStats(game), [game]);
  const [elapsedSeconds, setElapsedSeconds] = useAtom(
    sudokuElapsedSecondsAtom
  );
  const [notice, setNotice] = useAtom(sudokuNoticeAtom);

  const startNewGame = useSetAtom(startNewSudokuGameAtom);
  const restartGame = useSetAtom(restartCurrentSudokuAtom);
  const selectCell = useSetAtom(selectSudokuCellAtom);
  const inputDigit = useSetAtom(placeSudokuDigitAtom);
  const clearCell = useSetAtom(clearSudokuCellAtom);
  const toggleNotesMode = useSetAtom(toggleSudokuNotesModeAtom);
  const undoMove = useSetAtom(undoSudokuMoveAtom);
  const triggerHint = useSetAtom(triggerSudokuHintAtom);
  const applyHintValue = useSetAtom(applyHintValueAtom);
  const dismissHint = useSetAtom(dismissSudokuHintAtom);
  const togglePause = useSetAtom(toggleSudokuPauseAtom);

  // Auto-dismiss toast notice after 3.2s
  useEffect(() => {
    let timer: number | undefined;
    if (notice) {
      timer = window.setTimeout(() => {
        setNotice(null);
      }, 3200);
    }
    return () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [notice, setNotice]);

  // Live timer while puzzle is active and unpaused
  useEffect(() => {
    let interval: number | undefined;
    if (game.status === "playing") {
      interval = window.setInterval(() => {
        setElapsedSeconds((previous) => previous + 1);
      }, 1000);
    }
    return () => {
      if (interval !== undefined) {
        window.clearInterval(interval);
      }
    };
  }, [game.status, setElapsedSeconds]);

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      // Undo: Cmd+Z or Ctrl+Z
      if (key === "z" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        undoMove();
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const isTargetInsideGrid =
        event.target instanceof HTMLElement &&
        Boolean(event.target.closest('[role="grid"]'));
      const isTargetBody = event.target === document.body;

      if (
        (isTargetInsideGrid || isTargetBody) &&
        didHandleNavigationKey(
          key,
          event.shiftKey,
          game.selectedCell,
          selectCell
        )
      ) {
        event.preventDefault();
        return;
      }

      const actions: KeyboardActions = {
        selectCell,
        inputDigit,
        clearCell,
        toggleNotesMode,
        triggerHint,
        dismissHint,
        togglePause,
      };

      if (didHandleActionKey(key, actions)) {
        event.preventDefault();
        return;
      }

      // Strictly accept 1-9 digits only
      if (!/^[1-9]$/u.test(event.key)) {
        return;
      }

      event.preventDefault();
      inputDigit(Number(event.key));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    clearCell,
    dismissHint,
    game.selectedCell,
    inputDigit,
    selectCell,
    toggleNotesMode,
    togglePause,
    triggerHint,
    undoMove,
  ]);

  const handleDifficultySelect = useCallback(
    (difficulty: SudokuDifficulty) => {
      startNewGame(difficulty);
    },
    [startNewGame]
  );

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <section
      ref={containerRef}
      className="bg-background relative flex h-full w-full flex-1 flex-col overflow-hidden"
    >
      {/* Top HUD: Difficulty, Timer Widget, New Game, Fullscreen */}
      <SudokuTopHud
        difficulty={game.difficulty}
        elapsedSeconds={elapsedSeconds}
        isPaused={game.status === "paused"}
        isFullscreen={isFullscreen}
        onSelectDifficulty={handleDifficultySelect}
        onTogglePause={() => {
          togglePause();
        }}
        onRestart={() => {
          restartGame();
        }}
        onNewGame={() => {
          startNewGame();
        }}
        onToggleFullscreen={() => {
          void toggleFullscreen();
        }}
      />

      {/* Logical Rule Hint Explanation Banner */}
      <AnimatePresence>
        {game.activeHint ? (
          <SudokuHintBanner
            hint={game.activeHint}
            onApply={() => {
              applyHintValue();
            }}
            onDismiss={() => {
              dismissHint();
            }}
          />
        ) : null}
      </AnimatePresence>

      {/* Main Board Arena */}
      <div className="bg-card/25 relative flex min-h-0 w-full flex-1 flex-col items-center justify-between gap-4 overflow-auto p-3 sm:p-5">
        {/* Sudoku 9x9 Grid */}
        <SudokuGrid
          grid={game.grid}
          selectedCell={game.selectedCell}
          activeHint={game.activeHint}
          isPaused={game.status === "paused"}
          onSelectCell={(row, col) => {
            selectCell({ row, col });
          }}
        />

        {/* Tactile Keypad Controls */}
        <SudokuKeypad
          digitCounts={stats.digitCounts}
          isNotesMode={game.isNotesMode}
          hintsRemaining={game.hintsRemaining}
          canUndo={stats.canUndo}
          onInputDigit={(digit) => {
            inputDigit(digit);
          }}
          onClear={() => {
            clearCell();
          }}
          onToggleNotesMode={() => {
            toggleNotesMode();
          }}
          onHint={() => {
            triggerHint();
          }}
          onUndo={() => {
            undoMove();
          }}
        />
      </div>

      {/* Paused Overlay */}
      {game.status === "paused" && (
        <div className="bg-background/85 absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground">
              Game Paused
            </h2>
            <p className="font-mono text-sm text-muted-foreground">
              Elapsed Time: {formattedTime}
            </p>
          </div>
          <Button
            onClick={() => {
              togglePause();
            }}
            className="gap-2 font-bold uppercase tracking-wider"
          >
            Resume Playing
          </Button>
        </div>
      )}

      {/* Victory Celebration Modal */}
      <SudokuVictoryDialog
        open={game.status === "won"}
        elapsedSeconds={elapsedSeconds}
        difficulty={game.difficulty}
        onPlayAgain={() => {
          startNewGame(game.difficulty);
        }}
      />
    </section>
  );
};

export default Sudoku;
