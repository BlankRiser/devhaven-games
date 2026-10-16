"use client";

import { CheckIcon, CopyIcon, PlayIcon } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatedCircle, AnimatedCross, Cell } from "./board-assets";
import type { OnlineGameOutcome } from "./tic-tac-toe-types";

export interface TicTacToeOnlineBoardProperties {
  readonly board: (string | null)[];
  readonly boardSize: number;
  readonly copiedLink: boolean;
  readonly isOnlineTurn: boolean;
  readonly myRole: string | null;
  readonly onCellClick: (index: number) => void;
  readonly onCopyInviteLink: () => void;
  readonly onNextRound: () => void;
  readonly playerCount: number;
  readonly winner: OnlineGameOutcome;
  readonly winningLine: number[] | null;
}

export const TicTacToeOnlineBoard = ({
  board,
  boardSize,
  copiedLink,
  isOnlineTurn,
  myRole,
  onCellClick,
  onCopyInviteLink,
  onNextRound,
  playerCount,
  winner,
  winningLine,
}: TicTacToeOnlineBoardProperties) => {
  const isDraw = winner === "draw";

  return (
    <div className="bg-card/30 relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden p-4">
      {playerCount < 2 && (
        <div className="border-border bg-card/95 absolute top-6 z-20 flex flex-col items-center gap-2 border p-3.5 text-center font-mono shadow-md backdrop-blur-xs">
          <span className="text-foreground text-xs font-bold tracking-wider uppercase">
            Waiting for Player 2 to join...
          </span>
          <span className="text-muted-foreground max-w-xs text-xs">
            Share this invite link with a friend to play together in real-time.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={onCopyInviteLink}
            className="mt-1 h-7 gap-1.5 text-xs"
          >
            {copiedLink ? (
              <CheckIcon className="size-3.5 text-emerald-500" />
            ) : (
              <CopyIcon className="size-3.5" />
            )}
            <span>{copiedLink ? "Link Copied!" : "Copy Invite Link"}</span>
          </Button>
        </div>
      )}

      {myRole === "spectator" && (
        <div className="border-border bg-secondary/80 text-muted-foreground absolute bottom-6 z-20 flex items-center gap-2 border px-3 py-1 font-mono text-xs">
          <span>Watching live match as a Spectator.</span>
        </div>
      )}

      <div
        style={{ height: boardSize, width: boardSize }}
        className="border-border bg-secondary/40 relative grid grid-cols-3 grid-rows-3 gap-1.5 border p-1.5 shadow-xs"
      >
        {board.map((value, cellIndex) => {
          const rowIndex = Math.floor(cellIndex / 3);
          const columnIndex = cellIndex % 3;
          const isWinningCell = Boolean(winningLine?.includes(cellIndex));
          const cellLabel =
            typeof value === "string"
              ? `Row ${rowIndex + 1}, Column ${columnIndex + 1}, ${value}`
              : `Row ${rowIndex + 1}, Column ${columnIndex + 1}`;

          return (
            <Cell
              key={`online-${cellIndex}`}
              isSelected={value !== null}
              onClick={() => {
                onCellClick(cellIndex);
              }}
              className={cn(
                isWinningCell && "bg-accent/70",
                !isOnlineTurn && value === null && "cursor-not-allowed opacity-90"
              )}
              aria-label={cellLabel}
            >
              <AnimatePresence>
                {value === "X" && (
                  <AnimatedCross className="text-foreground size-3/5" />
                )}
                {value === "O" && (
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
              {winner === "X" && (
                <AnimatedCross className="text-foreground size-16 sm:size-20" />
              )}
              {winner === "O" && (
                <AnimatedCircle className="text-chart-2 size-16 sm:size-20" />
              )}
              <div className="flex flex-col items-center gap-1">
                <span className="font-heading text-xl font-bold tracking-tight uppercase sm:text-2xl">
                  {isDraw ? "Round Draw" : `Player ${winner} Wins!`}
                </span>
                <span className="text-muted-foreground text-xs">
                  Scores persist across rounds. Click below to continue.
                </span>
              </div>
              <Button
                onClick={onNextRound}
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
  );
};
