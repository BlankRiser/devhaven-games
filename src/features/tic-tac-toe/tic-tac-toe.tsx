'use client';
import React from 'react';
import { AnimatedCircle, AnimatedCross, Cell } from './boards-assets';
import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'motion/react';
import { motion } from 'motion/react';

type Players = 'x' | 'o';
type PlayerStates = Players | null;

const defaultBoardState: PlayerStates[][] = Array(3)
  .fill(null)
  .map(() => Array(3).fill(null));

export const TicTacToe = () => {
  const [board, setBoard] = React.useState<PlayerStates[][]>(defaultBoardState);
  const [turn, setTurn] = React.useState<Players>('x');
  const [winner, setWinner] = React.useState<PlayerStates>(null);

  const resetBoard = () => {
    setWinner(null);
    setTurn('x');
    setBoard(
      Array(3)
        .fill(null)
        .map(() => Array(3).fill(null)),
    );
  };

  const checkForWinner = (board: (null | string)[][]): PlayerStates => {
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
    // No winner
    return null;
  };

  return (
    <section className="border rounded-md border-zinc-200 dark:border-zinc-800 w-full h-full grid place-items-center">
      <div className="flex flex-col gap-3">
        <div className="relative border overflow-hidden border-zinc-200 dark:border-zinc-800 p-1 rounded-md flex flex-col gap-1 bg-zinc-100 dark:bg-zinc-900">
          {board.map((columns, idx) => {
            return (
              <div key={idx} className="flex flex-row gap-1">
                {columns.map((value, jdx) => {
                  return (
                    <Cell
                      key={idx + jdx}
                      isSelected={value !== null}
                      onClick={() => {
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
                      }}
                    >
                      <AnimatePresence>
                        {value === 'x' && <AnimatedCross className="text-indigo-400" />}
                        {value === 'o' && <AnimatedCircle className="text-teal-400" />}
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
                {winner === 'x' && <AnimatedCross className="size-40 text-indigo-400" />}
                {winner === 'o' && <AnimatedCircle className="size-40 text-teal-400" />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Button onClick={resetBoard}>{winner !== null ? 'Restart' : 'Reset'}</Button>
      </div>
    </section>
  );
};
