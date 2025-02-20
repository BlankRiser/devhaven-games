'use client';

import { TicTacToe } from './tic-tac-toe/tic-tac-toe';

export const GAMES_LIST = [
  {
    slug: 'tic-tac-toe',
    label: 'Tic Tac Toe',
    description: 'Play Tic Tac Toe with your friends',
    icon: 'gamepad',
    color: 'green',
    url: '/games/tic-tac-toe',
    component: TicTacToe,
  },
];
