export type SiteGameSlug =
  | "tic-tac-toe"
  | "sudoku"
  | "spider-solitaire"
  | "minesweeper"
  | "pacman"
  | "hangman"
  | "flappy-bird";

export interface GameSeoMetadata {
  applicationCategory: string;
  category: string;
  categoryLabel: string;
  description: string;
  features: string[];
  genre: string;
  keywords: string[];
  metaTitle: string;
  numberOfPlayersMax: number;
  numberOfPlayersMin: number;
  operatingSystem: string;
  players: string;
  slug: SiteGameSlug;
  specId: string;
  status: "completed" | "wip";
  supportsMultiplayer: boolean;
  title: string;
}

export const siteMetadata = {
  applicationName: "DevHaven Games",
  author: "Ram Shankar Choudhary",
  authorUrl: "https://ram.codes",
  category: "games",
  classification: "Game, Puzzle, Arcade, Web Application",
  description:
    "Play free online games instantly in your browser—no downloads, installations, or ads. Challenge friends in multiplayer Tic-Tac-Toe, solve Sudoku puzzles, play classic Spider Solitaire and Minesweeper, explore the Pac-Man maze, and test your vocabulary with Hangman. Jump into quick arcade games and brain teasers on any device.",
  githubUrl: "https://github.com/BlankRiser/devhaven-games",
  keywords: [
    "free online games",
    "browser games no ads",
    "web games",
    "multiplayer web games",
    "tic tac toe online multiplayer",
    "sudoku online free",
    "spider solitaire online",
    "minesweeper classic",
    "pacman browser game",
    "hangman word puzzle",
    "daily logic puzzles",
    "devhaven games",
    "open source web games",
  ],
  locale: "en_US",
  name: "DevHaven Games",
  tagline: "Free Online Games, Brain Teasers & Multiplayer Fun",
  themeColor: "#121212",
  title: "DevHaven Games | Free Web Games, Word Puzzles & Multiplayer Arcade",
  twitterHandle: "@BlankRiser",
  url: "https://games.ram.codes",
};

export const gameMetadataCatalog: Record<SiteGameSlug, GameSeoMetadata> = {
  "tic-tac-toe": {
    applicationCategory: "GameApplication",
    category: "board-games",
    categoryLabel: "Board Games",
    description:
      "Play Tic-Tac-Toe online for free and challenge a friend to a quick game of Xs and Os. Create a room and share a link to play together in real time, or enjoy a classic two-player game on the same device. Outsmart your opponent, line up three symbols, and see who wins!",
    features: [
      "Real-time WebSocket multiplayer",
      "Room code & instant invite link sharing",
      "Local pass-and-play mode",
      "Score & win-streak tracking",
    ],
    genre: "Strategy, Board Game",
    keywords: [
      "tic tac toe online",
      "tic tac toe",
      "multiplayer tic tac toe",
      "2 player tic tac toe",
      "play tic tac toe with friends",
      "noughts and crosses online",
      "real time tic tac toe",
    ],
    metaTitle: "Tic Tac Toe",
    numberOfPlayersMax: 2,
    numberOfPlayersMin: 1,
    operatingSystem: "Any",
    players: "1-2 Players",
    slug: "tic-tac-toe",
    specId: "SYS-01",
    status: "completed",
    supportsMultiplayer: true,
    title: "Tic Tac Toe",
  },
  sudoku: {
    applicationCategory: "GameApplication",
    category: "word-puzzle",
    categoryLabel: "Word & Puzzle",
    description:
      "Enjoy free Sudoku online with number puzzles for every skill level. Fill the 9x9 grid so every row, column, and 3x3 box contains the numbers 1 through 9 without repeats. Use pencil notes to track possibilities, challenge yourself with different difficulty levels, and sharpen your logical thinking—all in your browser, with no download required.",
    features: [
      "Tier-based puzzle generator",
      "Full keyboard navigation with Tab and Enter",
      "Pencil candidate notes drafting mode",
      "Mistake-free timer mode",
      "Erase, reset, and new game controls",
    ],
    genre: "Logic, Puzzle",
    keywords: [
      "sudoku online free",
      "daily sudoku puzzle",
      "sudoku logic grid",
      "play sudoku in browser",
      "sudoku tier difficulty",
      "sudoku with notes",
      "free brain puzzles",
    ],
    metaTitle: "Sudoku",
    numberOfPlayersMax: 1,
    numberOfPlayersMin: 1,
    operatingSystem: "Any",
    players: "1 Player",
    slug: "sudoku",
    specId: "SYS-02",
    status: "completed",
    supportsMultiplayer: false,
    title: "Sudoku",
  },
  "spider-solitaire": {
    applicationCategory: "GameApplication",
    category: "card-games",
    categoryLabel: "Card Games",
    description:
      "Play Spider Solitaire online for free and put your card-playing strategy to the test. Arrange cards in descending order from King to Ace, build complete sequences of the same suit, and clear all ten columns to win. Undo moves, rethink your strategy, and enjoy a classic solitaire card game whenever you need a relaxing break.",
    features: [
      "Smooth dealing animations from bottom-right deck",
      "Solvable deal validation and complete card decks",
      "Unlimited undo & move history",
      "King-to-Ace run completion animations",
      "Auto card cascading",
    ],
    genre: "Card Game, Patience, Solitaire",
    keywords: [
      "spider solitaire online",
      "free spider solitaire",
      "spider solitaire card game",
      "play spider solitaire in browser",
      "classic card patience",
      "solitaire with undo",
    ],
    metaTitle: "Spider Solitaire",
    numberOfPlayersMax: 1,
    numberOfPlayersMin: 1,
    operatingSystem: "Any",
    players: "1 Player",
    slug: "spider-solitaire",
    specId: "SYS-03",
    status: "completed",
    supportsMultiplayer: false,
    title: "Spider Solitaire",
  },
  minesweeper: {
    applicationCategory: "GameApplication",
    category: "board-games",
    categoryLabel: "Board Games",
    description:
      "Play Minesweeper online for free in this classic minefield logic puzzle. Reveal squares, use the numbers to figure out where hidden mines are buried, and flag dangerous tiles without triggering an explosion. Every move is a test of logic and careful planning. Can you clear the entire board and beat your best time?",
    features: [
      "First-click mine safety guarantee",
      "Right-click / toggle flagging mode",
      "Live mine counter and timer",
      "Cascading blank cell reveals",
    ],
    genre: "Logic, Puzzle, Retro",
    keywords: [
      "minesweeper online",
      "free minesweeper",
      "classic minesweeper game",
      "sweep the minefield",
      "retro minesweeper browser",
      "logic grid bomb puzzle",
    ],
    metaTitle: "Minesweeper",
    numberOfPlayersMax: 1,
    numberOfPlayersMin: 1,
    operatingSystem: "Any",
    players: "1 Player",
    slug: "minesweeper",
    specId: "SYS-04",
    status: "completed",
    supportsMultiplayer: false,
    title: "Minesweeper",
  },
  pacman: {
    applicationCategory: "GameApplication",
    category: "2d-platformer",
    categoryLabel: "2D Platformer",
    description:
      "Relive the fun of classic Pac-Man in this free online arcade maze game. Guide Pac-Man through winding corridors, gobble up every pellet, and avoid Blinky, Pinky, Inky, and Clyde as they chase you through the maze. Grab power pellets to turn the tables on the ghosts, rack up points, and see how long you can survive.",
    features: [
      "Square aspect ratio canvas without asset stretching",
      "Four authentic ghost AI patrol behaviors",
      "Energizer power pellets & ghost score multipliers",
      "Desktop view optimization with responsive alerts",
    ],
    genre: "Arcade, Retro, Maze",
    keywords: [
      "pacman online",
      "pacman browser game",
      "free retro pacman",
      "neon maze pacman",
      "play pacman desktop",
      "arcade classic 80s",
    ],
    metaTitle: "Pac-Man",
    numberOfPlayersMax: 1,
    numberOfPlayersMin: 1,
    operatingSystem: "Any",
    players: "1 Player",
    slug: "pacman",
    specId: "SYS-05",
    status: "completed",
    supportsMultiplayer: false,
    title: "Pac-Man",
  },
  hangman: {
    applicationCategory: "GameApplication",
    category: "word-puzzle",
    categoryLabel: "Word & Puzzle",
    description:
      "Play Hangman online for free and see if you can guess the hidden word before you run out of chances. Pick letters one at a time, use category clues to narrow down your choices, and uncover the answer before the drawing is complete. It's a fun way to test your spelling, build your vocabulary, and enjoy a quick word-guessing challenge.",
    features: [
      "Clean vector gallows with tight alignment",
      "Categorized dictionary word banks",
      "On-screen and physical keyboard letter tracking",
      "Win streak and score counter",
    ],
    genre: "Word, Trivia, Puzzle",
    keywords: [
      "hangman online",
      "free hangman game",
      "word guessing puzzle",
      "spelling game browser",
      "vocabulary deduction game",
      "hangman word categories",
    ],
    metaTitle: "Hangman",
    numberOfPlayersMax: 1,
    numberOfPlayersMin: 1,
    operatingSystem: "Any",
    players: "1 Player",
    slug: "hangman",
    specId: "SYS-06",
    status: "completed",
    supportsMultiplayer: false,
    title: "Hangman",
  },
  "flappy-bird": {
    applicationCategory: "GameApplication",
    category: "2d-platformer",
    categoryLabel: "2D Platformer",
    description:
      "Test your timing and reflexes in this Flappy Bird-inspired browser arcade game. Tap, click, or press the spacebar to keep your bird flying through narrow gaps between pipes without crashing. Each obstacle is another chance to beat your high score, but one mistimed flap can end your run. How far can you fly?",
    features: [
      "One-touch reflex physics engine",
      "Procedurally generated obstacle pipes",
      "High score persistence",
      "Instant restart loop",
    ],
    genre: "Arcade, Reflex, Action",
    keywords: [
      "flappy bird online",
      "play flappy bird browser",
      "retro tap arcade game",
      "endless reflex game",
      "flappy bird high score",
    ],
    metaTitle: "Flappy Bird",
    numberOfPlayersMax: 1,
    numberOfPlayersMin: 1,
    operatingSystem: "Any",
    players: "1 Player",
    slug: "flappy-bird",
    specId: "SYS-07",
    status: "wip",
    supportsMultiplayer: false,
    title: "Flappy Bird",
  },
};

export const gameSlugs: readonly SiteGameSlug[] = [
  "tic-tac-toe",
  "sudoku",
  "spider-solitaire",
  "minesweeper",
  "pacman",
  "hangman",
  "flappy-bird",
];

const gameSlugSet: ReadonlySet<string> = new Set(gameSlugs);

const isGameSlug = (candidate: string): candidate is SiteGameSlug =>
  gameSlugSet.has(candidate);

export const getGameMetadata = (
  slug: string
): GameSeoMetadata | undefined =>
  isGameSlug(slug) ? gameMetadataCatalog[slug] : undefined;
