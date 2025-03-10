'use client';

import { Hangman } from './hangman/hangman';
import { Minesweeper } from './minesweeper/minesweeper';
import { TicTacToe } from './tic-tac-toe/tic-tac-toe';

export const GAMES_LIST = [
  {
    slug: 'tic-tac-toe',
    status: 'completed',
    label: 'Tic Tac Toe',
    description: 'Take turns marking X and O on a 3x3 grid to win.',
    icon: 'gamepad',
    color: 'green',
    url: '/games/tic-tac-toe',
    component: TicTacToe,
  },
  {
    slug: 'hangman',
    status: 'completed',
    label: 'Hangman',
    description: 'Guess the secret word before the stick figure is hung.',
    icon: 'gamepad',
    color: 'green',
    url: '/games/hangman',
    component: Hangman,
  },
  {
    slug: 'minesweeper',
    status: 'wip',
    label: 'Minesweeper',
    description: 'Clear the minefield without detonating any mines.',
    icon: 'gamepad',
    color: 'green',
    url: '/games/minesweeper',
    component: Minesweeper,
  },
];
