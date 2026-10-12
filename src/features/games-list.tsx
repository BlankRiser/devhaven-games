'use client';

import dynamic from 'next/dynamic';

const FlappyBird = dynamic(() => import('./flappy-bird/flappy-bird'), { ssr: false });
const Hangman = dynamic(() => import('./hangman/hangman'), { ssr: false });
const Minesweeper = dynamic(() => import('./minesweeper/minesweeper'), { ssr: false });
const TicTacToe = dynamic(() => import('./tic-tac-toe/tic-tac-toe'), { ssr: false });

export type GameCategoryId = 'board-games' | '2d-platformer' | 'word-puzzle' | 'card-games';

export interface GameCategory {
  id: GameCategoryId;
  label: string;
  description: string;
}

export const GAME_CATEGORIES: GameCategory[] = [
  {
    id: 'board-games',
    label: 'Board Games',
    description: 'Grid-based tactics, tabletop classics, and head-to-head strategy.',
  },
  {
    id: '2d-platformer',
    label: '2D Platformer',
    description: 'Fast-paced side-scrolling action and reflex arcade challenges.',
  },
  {
    id: 'word-puzzle',
    label: 'Word & Puzzle',
    description: 'Vocabulary deduction, logic riddles, and brain teasers.',
  },
  {
    id: 'card-games',
    label: 'Card Games',
    description: 'Classic deck games and tabletop card showdowns.',
  },
];

export const GAMES_LIST = [
  {
    slug: 'tic-tac-toe',
    status: 'completed' as const,
    label: 'Tic Tac Toe',
    description: 'Take turns marking X and O on a 3x3 grid to win.',
    category: 'board-games' as GameCategoryId,
    categoryLabel: 'Board Games',
    players: '2 Players',
    tags: [ 'board', 'grid', 'strategy', '2p', 'classic', 'local multiplayer' ],
    icon: 'gamepad',
    color: 'green',
    url: '/games/tic-tac-toe',
    component: TicTacToe,
  },
  {
    slug: 'hangman',
    status: 'completed' as const,
    label: 'Hangman',
    description: 'Guess the secret word before the stick figure is hung.',
    category: 'word-puzzle' as GameCategoryId,
    categoryLabel: 'Word & Puzzle',
    players: '1 Player',
    tags: [ 'word', 'puzzle', 'letters', 'guessing', 'vocabulary' ],
    icon: 'gamepad',
    color: 'green',
    url: '/games/hangman',
    component: Hangman,
  },
  {
    slug: 'minesweeper',
    status: 'completed' as const,
    label: 'Minesweeper',
    description: 'Clear the minefield without detonating any mines.',
    category: 'board-games' as GameCategoryId,
    categoryLabel: 'Board Games',
    players: '1 Player',
    tags: [ 'board', 'grid', 'mines', 'logic', 'puzzle' ],
    icon: 'gamepad',
    color: 'green',
    url: '/games/minesweeper',
    component: Minesweeper,
  },
  {
    slug: 'flappy-bird',
    status: 'wip' as const,
    label: 'Flappy Bird',
    description: 'Tap or press space to flap through the pipes.',
    category: '2d-platformer' as GameCategoryId,
    categoryLabel: '2D Platformer',
    players: '1 Player',
    tags: [ '2d', 'platformer', 'arcade', 'reflex', 'endless', 'action' ],
    icon: 'gamepad',
    color: 'green',
    url: '/games/flappy-bird',
    component: FlappyBird,
  },
];

export function getVisibleGames() {
  return GAMES_LIST.filter((game) => {
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    return game.status === 'completed';
  });
}
