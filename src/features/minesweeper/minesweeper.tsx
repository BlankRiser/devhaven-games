'use client';

import { Button } from '@/components/ui/button';
import { useAtom } from 'jotai';
import { motion } from 'motion/react';
import { boardAtom } from './minesweeper-utils';

const icons = {
  grid: 6, // 6x6 grid
  flag: '🚩',
  mine: '💣',
};

export const Minesweeper = () => {
  const [board, resetBoard] = useAtom(boardAtom);

  const handleCellClick = (row: number, col: number) => {
    console.log('cell clicked', row, col, board[row][col]);

    if (board[row][col] === 0) {
      // reveal all tiles with 0
    }

    if (board[row][col] === '💣') {
      console.log('game over');
    }
  };

  return (
    <section className="border rounded-md border-zinc-200 dark:border-zinc-800 w-full h-full overflow-hidden">
      <div className="grid place-items-center h-full w-full">
        <div className="flex flex-col gap-1">
          {board.map((row, rowIndex) => (
            <div key={row.toString()} className="flex gap-1">
              {row.map((cell, colIndex) => (
                <motion.button
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  key={`${row.toString()}-${cell.toString()}`}
                  className="border rounded-md border-zinc-200 dark:border-zinc-800 size-15 md:size-10 grid place-items-center"
                >
                  {cell === 'mine' ? icons.mine : cell}
                </motion.button>
              ))}
            </div>
          ))}
        </div>
        <Button
          onClick={() => {
            resetBoard();
          }}
        >
          Reset
        </Button>
      </div>
    </section>
  );
};
