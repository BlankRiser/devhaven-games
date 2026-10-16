"use client";

import dynamic from "next/dynamic";

const FlappyBird = dynamic(
  async () => await import("./flappy-bird/flappy-bird"),
  { ssr: false }
);
const Hangman = dynamic(async () => await import("./hangman/hangman"), {
  ssr: false,
});
const Minesweeper = dynamic(
  async () => await import("./minesweeper/minesweeper"),
  { ssr: false }
);
const Pacman = dynamic(async () => await import("./pacman/pacman"), {
  ssr: false,
});
const SpiderSolitaire = dynamic(
  async () => await import("./spider-solitaire/spider-solitaire"),
  { ssr: false }
);
const TicTacToe = dynamic(
  async () => await import("./tic-tac-toe/tic-tac-toe"),
  { ssr: false }
);

export type GameCategoryId =
  | "board-games"
  | "2d-platformer"
  | "word-puzzle"
  | "card-games"
  | "multiplayer";

export interface GameCategory {
  description: string;
  id: GameCategoryId;
  label: string;
}

export const GAME_CATEGORIES: GameCategory[] = [
  {
    description:
      "Cross-device real-time multiplayer games with room codes and instant invite links.",
    id: "multiplayer",
    label: "Online Multiplayer",
  },
  {
    description:
      "Grid-based tactics, tabletop classics, and head-to-head strategy.",
    id: "board-games",
    label: "Board Games",
  },
  {
    description:
      "Fast-paced side-scrolling action and reflex arcade challenges.",
    id: "2d-platformer",
    label: "2D Platformer",
  },
  {
    description: "Vocabulary deduction, logic riddles, and brain teasers.",
    id: "word-puzzle",
    label: "Word & Puzzle",
  },
  {
    description: "Classic deck games and tabletop card showdowns.",
    id: "card-games",
    label: "Card Games",
  },
];

export const GAMES_LIST = [
  {
    category: "board-games" as GameCategoryId,
    categoryLabel: "Board Games",
    color: "green",
    component: TicTacToe,
    description:
      "Take turns marking X and O on a 3x3 grid to win. Supports local & cross-device online play.",
    icon: "gamepad",
    label: "Tic Tac Toe",
    players: "1-2 Players",
    slug: "tic-tac-toe",
    status: "completed" as const,
    supportsMultiplayer: true,
    tags: [
      "board",
      "grid",
      "strategy",
      "2p",
      "classic",
      "multiplayer",
      "online multiplayer",
      "local multiplayer",
    ],
    url: "/games/tic-tac-toe",
  },
  {
    slug: "hangman",
    status: "completed" as const,
    label: "Hangman",
    description: "Guess the secret word before the stick figure is hung.",
    category: "word-puzzle" as GameCategoryId,
    categoryLabel: "Word & Puzzle",
    players: "1 Player",
    tags: ["word", "puzzle", "letters", "guessing", "vocabulary"],
    icon: "gamepad",
    color: "green",
    url: "/games/hangman",
    component: Hangman,
  },
  {
    slug: "minesweeper",
    status: "completed" as const,
    label: "Minesweeper",
    description: "Clear the minefield without detonating any mines.",
    category: "board-games" as GameCategoryId,
    categoryLabel: "Board Games",
    players: "1 Player",
    tags: ["board", "grid", "mines", "logic", "puzzle"],
    icon: "gamepad",
    color: "green",
    url: "/games/minesweeper",
    component: Minesweeper,
  },
  {
    slug: "spider-solitaire",
    status: "completed" as const,
    label: "Spider Solitaire",
    description:
      "Build descending King-to-Ace runs of the same suit across 10 columns.",
    category: "card-games" as GameCategoryId,
    categoryLabel: "Card Games",
    players: "1 Player",
    tags: ["card", "solitaire", "spider", "deck", "patience", "strategy"],
    icon: "gamepad",
    color: "green",
    url: "/games/spider-solitaire",
    component: SpiderSolitaire,
  },
  {
    slug: "pacman",
    status: "completed" as const,
    label: "Pac-Man",
    description:
      "Navigate the neon maze, gobble power pellets, and outsmart the four ghosts.",
    category: "2d-platformer" as GameCategoryId,
    categoryLabel: "2D Platformer",
    players: "1 Player",
    tags: ["arcade", "maze", "pacman", "ghosts", "retro", "2d", "pixi"],
    icon: "gamepad",
    color: "green",
    url: "/games/pacman",
    component: Pacman,
  },
  {
    slug: "flappy-bird",
    status: "wip" as const,
    label: "Flappy Bird",
    description: "Tap or press space to flap through the pipes.",
    category: "2d-platformer" as GameCategoryId,
    categoryLabel: "2D Platformer",
    players: "1 Player",
    tags: ["2d", "platformer", "arcade", "reflex", "endless", "action"],
    icon: "gamepad",
    color: "green",
    url: "/games/flappy-bird",
    component: FlappyBird,
  },
];

export function getVisibleGames() {
  return GAMES_LIST.filter((game) =>
    process.env.NODE_ENV === "development" ? true : game.status === "completed"
  );
}
