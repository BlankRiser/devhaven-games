'use client';

import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { AnimatedCircle, AnimatedCross, Cell } from './board-assets';

type Players = 'x' | 'o';
type CellState = Players | null;
type GameOutcome = Players | 'draw' | null;

const defaultBoardState: CellState[][] = Array(3)
  .fill(null)
  .map(() => Array(3).fill(null));

export default function TicTacToe(){
  const [ board, setBoard ] = React.useState<CellState[][]>(defaultBoardState);
  const [ turn, setTurn ] = React.useState<Players>('x');
  const [ winner, setWinner ] = React.useState<GameOutcome>(null);

  const resetBoard = () => {
    setWinner(null);
    setTurn('x');
    setBoard(
      Array(3)
        .fill(null)
        .map(() => Array(3).fill(null)),
    );
  };

  const checkForWinner = (board: CellState[][]): GameOutcome => {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (board[i][0] !== null && board[i][0] === board[i][1] && board[i][0] === board[i][2]) {
        return board[i][0] as Players;
      }
    }
    // Check columns
    for (let i = 0; i < 3; i++) {
      if (board[0][i] !== null && board[0][i] === board[1][i] && board[0][i] === board[2][i]) {
        return board[0][i] as Players;
      }
    }
    // Check diagonals
    if (board[0][0] !== null && board[0][0] === board[1][1] && board[0][0] === board[2][2]) {
      return board[0][0] as Players;
    }
    if (board[0][2] !== null && board[0][2] === board[1][1] && board[0][2] === board[2][0]) {
      return board[0][2] as Players;
    }
    // Check for draw
    const isDraw = board.every((row) => row.every((cell) => cell !== null));
    if (isDraw) return 'draw';

    // No winner
    return null;
  };

  const handleCellClick = (idx: number, jdx: number) => {
    // If a player has already selected a cell, do nothing
    if (board[idx][jdx] !== null || winner !== null) {
      return;
    }

    const updatedBoard = [ ...board ];

    if (turn === 'x') {
      updatedBoard[idx][jdx] = 'x';
      setTurn('o');
    } else {
      updatedBoard[idx][jdx] = 'o';
      setTurn('x');
    }

    setBoard(updatedBoard);

    const isWinner = checkForWinner(updatedBoard);
    if (isWinner !== null) {
      setWinner(isWinner);
      return;
    }
  };

  return (
    <section className="h-full w-full overflow-hidden border border-border bg-card/40">
      <div className="grid h-full w-full place-items-center p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border border-border bg-secondary/50 px-3 py-1.5 text-xs tracking-wider text-muted-foreground uppercase">
            <span>Grid // 3x3</span>
            <span>
              {winner === null
                ? `Turn: ${turn.toUpperCase()}`
                : winner === 'draw'
                  ? 'Outcome: Draw'
                  : `Cleared: ${winner.toUpperCase()}`}
            </span>
          </div>
          <div className="relative flex flex-col gap-1 overflow-hidden border border-border bg-secondary/40 p-1">
            {board.map((columns, idx) => {
              return (
                <div key={idx} className="flex flex-row gap-1">
                  {columns.map((value, jdx) => {
                    return (
                      <Cell key={idx + jdx} isSelected={value !== null} onClick={() => handleCellClick(idx, jdx)}>
                        <AnimatePresence>
                          {value === 'x' && <AnimatedCross className="size-8 text-foreground md:size-12" />}
                          {value === 'o' && <AnimatedCircle className="size-8 text-chart-2 md:size-12" />}
                        </AnimatePresence>
                      </Cell>
                    );
                  })}
                </div>
              );
            })}
            <AnimatePresence>
              {winner !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 grid h-full w-full place-items-center bg-card/95">
                  {winner === 'x' && <AnimatedCross className="size-40 text-foreground md:size-56" />}
                  {winner === 'o' && <AnimatedCircle className="size-40 text-chart-2 md:size-56" />}
                  {winner === 'draw' && (
                    <motion.span
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="border-2 border-foreground px-4 py-2 font-heading text-5xl font-medium tracking-[-0.025em] text-foreground uppercase md:text-7xl">
                      Draw
                    </motion.span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button onClick={resetBoard}>{winner !== null ? 'Restart' : 'Reset'}</Button>
        </div>
      </div>
    </section>
  );
};
