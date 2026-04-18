'use client';

import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { AnimatedCircle, AnimatedCross, Cell } from './board-assets';

type Players = 'x' | 'o';
type CellState = Players | null;
type GameOutcome = Players | 'draw' | null;

const defaultBoardState: CellState[][] = Array(3)
  .fill(null)
  .map(() => Array(3).fill(null));

export const TicTacToe = () => {
  const [board, setBoard] = React.useState<CellState[][]>(defaultBoardState);
  const [turn, setTurn] = React.useState<Players>('x');
  const [winner, setWinner] = React.useState<GameOutcome>(null);

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

    const updatedBoard = [...board];

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
    <section className="border rounded-md border-zinc-200 dark:border-zinc-800 w-full h-full overflow-hidden">
      <div className="grid place-items-center h-full w-full">
        <div className="flex flex-col gap-3">
          <div className="relative border overflow-hidden border-zinc-200 dark:border-zinc-800 p-1 rounded-md flex flex-col gap-1 bg-zinc-100 dark:bg-zinc-900">
            {board.map((columns, idx) => {
              return (
                <div key={idx} className="flex flex-row gap-1">
                  {columns.map((value, jdx) => {
                    return (
                      <Cell key={idx + jdx} isSelected={value !== null} onClick={() => handleCellClick(idx, jdx)}>
                        <AnimatePresence>
                          {value === 'x' && <AnimatedCross className="text-indigo-400 size-6 md:size-12" />}
                          {value === 'o' && <AnimatedCircle className="text-teal-400 size-6 md:size-12" />}
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
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="absolute inset-0 w-full h-full grid place-items-center bg-zinc-100 dark:bg-zinc-900"
                >
                  {winner === 'x' && <AnimatedCross className="size-40 md:size-56 text-indigo-400" />}
                  {winner === 'o' && <AnimatedCircle className="size-40 md:size-56 text-teal-400" />}
                  {winner === 'draw' && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', bounce: 0.5 }}
                      className="text-5xl border-zinc-200 dark:border-zinc-800 md:text-7xl font-bold text-zinc-700 dark:text-zinc-300"
                    >
                      Draw!
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
