"use client";

import NumberFlow from "@number-flow/react";
import {
  ArrowCounterClockwiseIcon,
  PlayIcon,
  TrashIcon,
  TrophyIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  FullscreenToggleButton,
  useGameFullscreen,
} from "@/features/common/use-game-fullscreen";
import { cn } from "@/lib/utils";
import { AnimatedCircle, AnimatedCross, Cell } from "./board-assets";

type Players = "x" | "o";
type CellState = Players | null;
type GameOutcome = Players | "draw" | null;

const createEmptyBoard = (): CellState[][] =>
  Array(3)
    .fill(null)
    .map(() => Array(3).fill(null));

export default function TicTacToe() {
  const { containerRef, isFullscreen, toggleFullscreen } = useGameFullscreen();
  const arenaReference = React.useRef<HTMLDivElement | null>(null);
  const [boardSize, setBoardSize] = React.useState(380);

  const [board, setBoard] = React.useState<CellState[][]>(createEmptyBoard);
  const [turn, setTurn] = React.useState<Players>("x");
  const [winner, setWinner] = React.useState<GameOutcome>(null);
  const [scores, setScores] = React.useState({ x: 0, o: 0, draw: 0 });

  const resetBoard = React.useCallback(() => {
    setWinner(null);
    setTurn("x");
    setBoard(createEmptyBoard());
  }, []);

  const resetScores = React.useCallback(() => {
    setScores({ x: 0, o: 0, draw: 0 });
    resetBoard();
  }, [resetBoard]);

  React.useEffect(() => {
    const element = arenaReference.current;
    if (!element) {
      return;
    }

    let rafId = 0;
    const updateSize = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const nextSize = Math.max(
          220,
          Math.floor(Math.min(rect.width - 32, rect.height - 32))
        );
        setBoardSize(nextSize);
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    window.addEventListener("resize", updateSize);
    document.addEventListener("fullscreenchange", updateSize);

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
      document.removeEventListener("fullscreenchange", updateSize);
    };
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.key.toLowerCase() !== "r"
      ) {
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

  const checkForWinner = (currentBoard: CellState[][]): GameOutcome => {
    for (let index = 0; index < 3; index++) {
      if (
        currentBoard[index][0] !== null &&
        currentBoard[index][0] === currentBoard[index][1] &&
        currentBoard[index][0] === currentBoard[index][2]
      ) {
        return currentBoard[index][0];
      }
    }
    for (let index = 0; index < 3; index++) {
      if (
        currentBoard[0][index] !== null &&
        currentBoard[0][index] === currentBoard[1][index] &&
        currentBoard[0][index] === currentBoard[2][index]
      ) {
        return currentBoard[0][index];
      }
    }
    if (
      currentBoard[0][0] !== null &&
      currentBoard[0][0] === currentBoard[1][1] &&
      currentBoard[0][0] === currentBoard[2][2]
    ) {
      return currentBoard[0][0];
    }
    if (
      currentBoard[0][2] !== null &&
      currentBoard[0][2] === currentBoard[1][1] &&
      currentBoard[0][2] === currentBoard[2][0]
    ) {
      return currentBoard[0][2];
    }
    const isDraw = currentBoard.every((row) =>
      row.every((cell) => cell !== null)
    );
    return isDraw ? "draw" : null;
  };

  const handleCellClick = (index: number, jdx: number) => {
    if (board[index][jdx] !== null || winner !== null) {
      return;
    }

    const updatedBoard = board.map((row) => [...row]);

    if (turn === "x") {
      updatedBoard[index][jdx] = "x";
      setTurn("o");
    } else {
      updatedBoard[index][jdx] = "o";
      setTurn("x");
    }

    setBoard(updatedBoard);

    const outcome = checkForWinner(updatedBoard);
    if (outcome === null) {
      return;
    }

    setWinner(outcome);
    setScores((previous) => {
      return {
        ...previous,
        [outcome]: previous[outcome] + 1,
      };
    });
  };

  const hasAnyScore = scores.x > 0 || scores.o > 0 || scores.draw > 0;

  return (
    <section
      ref={containerRef}
      className="bg-background relative flex h-full w-full flex-1 flex-col overflow-hidden"
    >
      {/* Top Control & Telemetry HUD Bar */}
      <div className="border-border bg-card z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2 text-xs uppercase">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] leading-none">
              Player X
            </span>
            <span className="text-foreground font-mono text-sm font-bold">
              <NumberFlow value={scores.x} />
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] leading-none">
              Draws
            </span>
            <span className="text-muted-foreground font-mono text-sm font-bold">
              <NumberFlow value={scores.draw} />
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] leading-none">
              Player O
            </span>
            <span className="text-chart-2 font-mono text-sm font-bold">
              <NumberFlow value={scores.o} />
            </span>
          </div>

          <span
            className={cn(
              "flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider",
              winner === "x" || winner === "o"
                ? "border-foreground bg-accent text-accent-foreground"
                : "border-border bg-secondary/50 text-foreground"
            )}
          >
            {winner !== null && winner !== "draw" && (
              <TrophyIcon className="text-chart-3 size-3.5" weight="fill" />
            )}
            {winner === null
              ? `Turn // Player ${turn.toUpperCase()}`
              : winner === "draw"
                ? "Outcome // Draw"
                : `Winner // Player ${winner.toUpperCase()}`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {hasAnyScore ? (
            <Button
              variant="outline"
              size="sm"
              onClick={resetScores}
              title="Reset Scoreboard"
              className="h-7 gap-1.5 px-2.5 text-[11px]"
            >
              <TrashIcon className="size-3.5" />
              <span>Clear Scores</span>
            </Button>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            onClick={resetBoard}
            title="Reset Board (Shortcut: R)"
            className="h-7 gap-1.5 px-2.5 text-[11px]"
          >
            <ArrowCounterClockwiseIcon className="size-3.5" />
            <span>{winner === null ? "Reset" : "Next Round"}</span>
          </Button>

          <FullscreenToggleButton
            isFullscreen={isFullscreen}
            onToggle={toggleFullscreen}
          />
        </div>
      </div>

      {/* Main Responsive Arena */}
      <div
        ref={arenaReference}
        className="bg-card/30 relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden p-4"
      >
        <div
          style={{ width: boardSize, height: boardSize }}
          className="border-border bg-secondary/40 relative grid grid-cols-3 grid-rows-3 gap-1.5 border p-1.5 shadow-xs"
        >
          {board.map((columns, index) =>
            columns.map((value, jdx) => (
              <Cell
                key={`${index}-${jdx}`}
                isSelected={value !== null}
                onClick={() => {
                  handleCellClick(index, jdx);
                }}
                aria-label={`Row ${index + 1}, Column ${jdx + 1}${value ? `, ${value.toUpperCase()}` : ""}`}
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
            ))
          )}

          <AnimatePresence>
            {winner !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-card/92 absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-6 text-center backdrop-blur-[2px]"
              >
                {winner === "x" && (
                  <AnimatedCross className="text-foreground size-28 sm:size-36" />
                )}
                {winner === "o" && (
                  <AnimatedCircle className="text-chart-2 size-28 sm:size-36" />
                )}
                <div className="flex flex-col items-center gap-1">
                  <span className="font-heading text-3xl font-bold tracking-tight uppercase sm:text-4xl">
                    {winner === "draw"
                      ? "Round Draw"
                      : `Player ${winner.toUpperCase()} Wins!`}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Press [R] or click below to start the next round.
                  </span>
                </div>
                <Button onClick={resetBoard} className="gap-1.5 px-6">
                  <PlayIcon className="size-4" weight="fill" />
                  <span>Play Next Round</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
