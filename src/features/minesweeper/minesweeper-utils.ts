'use client';

import { atomWithRefresh } from 'jotai/utils';

export const boardAtom = atomWithRefresh(() => generateBoard({ rows: 9, cols: 9, mines: 10 }));

export const generateBoard = ({ rows, cols, mines }: { rows: number; cols: number; mines: number }) => {
  const board = Array.from({ length: rows }, () => Array(cols).fill(0));
  const MINE = '💣';

  const positions = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      positions.push([row, col]);
    }
  }

  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  for (let i = 0; i < mines; i++) {
    const [row, col] = positions[i];
    board[row][col] = MINE;
  }

/**  const directions = [
 *        [-1, -1 ], [-1, 0 ], [-1, 1 ],
 *        [ 0, -1 ],           [ 0, 1 ],
 *        [ 1, -1 ], [ 1, 0 ], [ 1, 1 ]
 *    ];
 **/
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row][col] !== MINE) {
        let mineCount = 0;
        for (const [dx, dy] of directions) {
          const newRow = row + dx;
          const newCol = col + dy;
          if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && board[newRow][newCol] === MINE) {
            mineCount++;
          }
        }
        if (mineCount > 0) {
          board[row][col] = mineCount;
        } else {
          board[row][col] = 0;
        }
      }
    }
  }

  return board;
};