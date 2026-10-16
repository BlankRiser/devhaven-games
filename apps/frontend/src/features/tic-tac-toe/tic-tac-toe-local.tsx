"use client";

import NumberFlow from "@number-flow/react";
import {
  ArrowCounterClockwiseIcon,
  PlayIcon,
  TrashIcon,
  TrophyIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FullscreenToggleButton } from "@/features/common/use-game-fullscreen";
import { cn } from "@/lib/utils";
import { AnimatedCircle, AnimatedCross, Cell } from "./board-assets";
import {
  checkForLocalWinner,
  createEmptyLocalBoard,
} from "./tic-tac-toe-types";
import type {
  LocalCellState,
  LocalGameOutcome,
  LocalPlayer,
  LocalScores,
} from "./tic-tac-toe-types";

export interface TicTacToeLocalProperties {
  readonly boardSize: number;
  readonly isFullscreen: boolean;
  readonly onSwitchMode: (mode: "local" | "online") => void;
  readonly onToggleFullscreen: () => void;
}

const getOutcomeLabel = (winner: LocalGameOutcome, turn: LocalPlayer) => {
  if (winner === "draw") {
    return "Outcome // Draw";
  }
  return winner === "x" || winner === "o"
    ? `Winner // Player ${winner.toUpperCase()}`
    : `Turn // Player ${turn.toUpperCase()}`;
};

export const TicTacToeLocal = ({
  boardSize,
  isFullscreen,
  onSwitchMode,
  onToggleFullscreen,
}: TicTacToeLocalProperties) => {
  const [board, setBoard] = useState<LocalCellState[][]>(createEmptyLocalBoard);
  const [turn, setTurn] = useState<LocalPlayer>("x");
  const [winner, setWinner] = useState<LocalGameOutcome>(null);
  const [scores, setScores] = useState<LocalScores>({
    draw: 0,
    o: 0,
    x: 0,
  });

  const resetBoard = useCallback(() => {
    setWinner(null);
    setTurn("x");
    setBoard(createEmptyLocalBoard());
  }, []);

  const resetScores = useCallback(() => {
    setScores({ draw: 0, o: 0, x: 0 });
    resetBoard();
  }, [resetBoard]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isInput =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement;
      const hasModifierKey = event.metaKey || event.ctrlKey || event.altKey;
      const isKeyR = event.key.toLowerCase() === "r";

      if (isInput || hasModifierKey || !isKeyR) {
        return;
      }

      event.preventDefault();
      resetBoard();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [resetBoard]);

  const handleCellClick = (rowIndex: number, columnIndex: number) => {
    const currentCell = board[rowIndex]?.[columnIndex];
    if (currentCell !== null || winner !== null) {
      return;
    }

    const nextBoard = board.map((row) => [...row]);
    const nextPlayer: LocalPlayer = turn === "x" ? "o" : "x";
    nextBoard[rowIndex][columnIndex] = turn;
    setTurn(nextPlayer);
    setBoard(nextBoard);

    const outcome = checkForLocalWinner(nextBoard);
    if (typeof outcome !== "string") {
      return;
    }

    setWinner(outcome);
    setScores((previous) => ({ ...previous, [outcome]: previous[outcome] + 1 }));
  };

  const hasAnyScore = scores.x > 0 || scores.o > 0 || scores.draw > 0;
  const outcomeText = getOutcomeLabel(winner, turn);
  const hasWinnerTrophy = winner === "x" || winner === "o";

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden">
      <div className="border-border bg-card z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2 text-xs uppercase">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="border-border bg-secondary/50 flex items-center border p-0.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => {
                onSwitchMode("local");
              }}
              className="bg-foreground text-background px-2.5 py-1 font-semibold tracking-wider shadow-xs"
            >
              Local Play
            </button>
            <button
              type="button"
              onClick={() => {
                onSwitchMode("online");
              }}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-2.5 py-1 font-semibold tracking-wider transition-colors"
            >
              <UsersIcon className="size-3.5" />
              <span>Multiplayer</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs leading-none">
                Player X
              </span>
              <span className="text-foreground font-mono text-sm font-bold">
                <NumberFlow value={scores.x} />
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs leading-none">
                Draws
              </span>
              <span className="text-muted-foreground font-mono text-sm font-bold">
                <NumberFlow value={scores.draw} />
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs leading-none">
                Player O
              </span>
              <span className="text-chart-2 font-mono text-sm font-bold">
                <NumberFlow value={scores.o} />
              </span>
            </div>

            <span
              className={cn(
                "flex items-center gap-1.5 border px-2.5 py-1 font-mono text-xs font-bold tracking-wider",
                hasWinnerTrophy
                  ? "border-foreground bg-accent text-accent-foreground"
                  : "border-border bg-secondary/50 text-foreground"
              )}
            >
              {hasWinnerTrophy ? (
                <TrophyIcon className="text-chart-3 size-3.5" weight="fill" />
              ) : null}
              {outcomeText}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {hasAnyScore ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetScores();
              }}
              aria-label="Clear scores"
              className="h-7 gap-1.5 px-2.5 text-xs"
            >
              <TrashIcon className="size-3.5" />
              <span>Clear Scores</span>
            </Button>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetBoard();
            }}
            aria-label="Reset board or start next round"
            className="h-7 gap-1.5 px-2.5 text-xs"
          >
            <ArrowCounterClockwiseIcon className="size-3.5" />
            <span>{winner === null ? "Reset" : "Next Round"}</span>
          </Button>

          <FullscreenToggleButton
            isFullscreen={isFullscreen}
            onToggle={onToggleFullscreen}
          />
        </div>
      </div>

      <div className="bg-card/30 relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden p-4">
        <div
          style={{ height: boardSize, width: boardSize }}
          className="border-border bg-secondary/40 relative grid grid-cols-3 grid-rows-3 gap-1.5 border p-1.5 shadow-xs"
        >
          {board.flat().map((value, cellIndex) => {
            const rowIndex = Math.floor(cellIndex / 3);
            const columnIndex = cellIndex % 3;
            const cellAriaLabel =
              typeof value === "string"
                ? `Row ${rowIndex + 1}, Column ${columnIndex + 1}, ${value.toUpperCase()}`
                : `Row ${rowIndex + 1}, Column ${columnIndex + 1}`;

            return (
              <Cell
                key={`local-${cellIndex}`}
                isSelected={value !== null}
                onClick={() => {
                  handleCellClick(rowIndex, columnIndex);
                }}
                aria-label={cellAriaLabel}
              >
                <AnimatePresence>
                  {value === "x" && (
                    <AnimatedCross className="text-foreground size-3/5" />
                  )}
                  {value === "o" && (
                    <AnimatedCircle className="text-chart-2 size-3/5" />
                  )}
                </AnimatePresence>
              </Cell>
            );
          })}

          <AnimatePresence>
            {winner !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-card/92 absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-4 text-center backdrop-blur-[2px]"
              >
                {winner === "x" && (
                  <AnimatedCross className="text-foreground size-16 sm:size-20" />
                )}
                {winner === "o" && (
                  <AnimatedCircle className="text-chart-2 size-16 sm:size-20" />
                )}
                <div className="flex flex-col items-center gap-1">
                  <span className="font-heading text-xl font-bold tracking-tight uppercase sm:text-2xl">
                    {winner === "draw"
                      ? "Round Draw"
                      : `Player ${winner.toUpperCase()} Wins!`}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Press [R] or click below to start the next round.
                  </span>
                </div>
                <Button
                  onClick={() => {
                    resetBoard();
                  }}
                  className="h-8 gap-1.5 px-4 text-xs"
                >
                  <PlayIcon className="size-3.5" weight="fill" />
                  <span>Play Next Round</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
