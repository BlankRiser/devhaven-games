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
    "Play free online browser games with zero ads or installations. Enjoy daily Sudoku puzzles, real-time multiplayer Tic-Tac-Toe, Spider Solitaire, Minesweeper, and Pac-Man.",
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
  tagline: "Zero-Latency Web Games & Real-Time Multiplayer",
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
      "Play Tic-Tac-Toe online in real-time. Challenge friends across devices via room codes or play local 2-player grid battles with zero latency.",
    features: [
      "Real-time WebSocket multiplayer",
      "Room code & instant invite link sharing",
      "Local pass-and-play mode",
      "Score & win-streak tracking",
    ],
    genre: "Strategy, Board Game",
    keywords: [
      "tic tac toe online",
      "multiplayer tic tac toe",
      "2 player tic tac toe",
      "play tic tac toe with friends",
      "noughts and crosses online",
      "real time tic tac toe",
    ],
    metaTitle: "Tic-Tac-Toe Online - Free Real-Time Multiplayer & 2-Player Game",
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
      "Play free Sudoku online with 9x9 logic grids, tier-based difficulty ratings, keyboard navigation (Tab & Enter), pencil notes, and live completion timer.",
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
    metaTitle: "Sudoku Online - Free Daily Logic Puzzles & Tier-Based Grids",
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
      "Play classic Spider Solitaire online with animated bottom-right card deals, intelligent deck validation, full undo support, and 10 tableau columns.",
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
    metaTitle: "Spider Solitaire Online - Free Classic Card Patience Game",
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
      "Sweep the minefield without detonating hidden explosives. Classic retro Minesweeper featuring first-click safety, flag placement, and time tracking.",
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
    metaTitle: "Minesweeper Online - Free Classic Logic Grid & Minefield Challenge",
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
      "Chomp neon pellets, outsmart Blinky, Pinky, Inky, and Clyde, and clear the retro maze. Desktop-optimized Pac-Man with crisp aspect-ratio rendering.",
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
    metaTitle: "Pac-Man Online - Play Retro Arcade Neon Maze Game Free",
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
      "Test your vocabulary in Hangman. Deduce secret words letter-by-letter across various categories before the vector gallows drawing is completed.",
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
    metaTitle: "Hangman Online - Free Word Guessing & Vocabulary Puzzle",
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
      "Tap or press space to flap through pipe obstacles. Test your reflexes in this endless retro arcade side-scrolling physics challenge.",
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
    metaTitle: "Flappy Bird Online - Play Retro Tap Reflex Challenge",
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
