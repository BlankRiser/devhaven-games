import { atom } from 'jotai';

export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type SpiderSuitMode = 1 | 2 | 4;

export interface SpiderCard {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export interface SpiderMoveHint {
  fromCol: number;
  cardIndex: number;
  toCol: number | 'stock';
}

export interface SpiderSnapshot {
  columns: SpiderCard[][];
  stock: SpiderCard[][];
  completedSuits: Suit[];
  moves: number;
}

export interface SpiderGameState extends SpiderSnapshot {
  suitMode: SpiderSuitMode;
  history: SpiderSnapshot[];
  hint: SpiderMoveHint | null;
}

export const SUIT_MODES: Array<{
  mode: SpiderSuitMode;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    mode: 1,
    label: '1 Suit (Beginner)',
    shortLabel: '1 Suit',
    description: 'Spades only — ideal for learning Spider mechanics.',
  },
  {
    mode: 2,
    label: '2 Suits (Intermediate)',
    shortLabel: '2 Suits',
    description: 'Spades & Hearts — balanced tactical challenge.',
  },
  {
    mode: 4,
    label: '4 Suits (Expert)',
    shortLabel: '4 Suits',
    description: 'All four suits — classic master difficulty.',
  },
];

export const RANK_LABELS: Record<Rank, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

const ALL_RANKS: Rank[] = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ];

const getSuitsForMode = (suitMode: SpiderSuitMode): Suit[] => {
  if (suitMode === 1) {
    return [
      'spades',
      'spades',
      'spades',
      'spades',
      'spades',
      'spades',
      'spades',
      'spades',
    ];
  }
  if (suitMode === 2) {
    return [
      'spades',
      'spades',
      'spades',
      'spades',
      'hearts',
      'hearts',
      'hearts',
      'hearts',
    ];
  }
  return [
    'spades',
    'spades',
    'hearts',
    'hearts',
    'clubs',
    'clubs',
    'diamonds',
    'diamonds',
  ];
};

const shuffleCards = <T>(items: T[]): T[] => {
  const copy = [ ...items ];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ copy[i], copy[j] ] = [ copy[j], copy[i] ];
  }
  return copy;
};

export const createSpiderDeck = (suitMode: SpiderSuitMode): SpiderCard[] => {
  const suitSets = getSuitsForMode(suitMode);
  const deck: SpiderCard[] = [];

  suitSets.forEach((suit, setIdx) => {
    for (const rank of ALL_RANKS) {
      deck.push({
        id: `${suit}-${rank}-set${setIdx}`,
        suit,
        rank,
        faceUp: false,
      });
    }
  });

  return shuffleCards(deck);
};

export const createInitialGameState = (suitMode: SpiderSuitMode = 1): SpiderGameState => {
  const deck = createSpiderDeck(suitMode);
  const columns: SpiderCard[][] = Array.from({ length: 10 }, () => []);

  let deckCursor = 0;

  // First 4 columns get 6 cards; remaining 6 columns get 5 cards (total = 54 cards)
  for (let col = 0; col < 10; col++) {
    const count = col < 4 ? 6 : 5;
    for (let row = 0; row < count; row++) {
      const isTopCard = row === count - 1;
      columns[col].push({
        ...deck[deckCursor++],
        faceUp: isTopCard,
      });
    }
  }

  // Remaining 50 cards are divided into 5 stock deals of 10 cards each
  const stock: SpiderCard[][] = [];
  for (let dealIndex = 0; dealIndex < 5; dealIndex++) {
    const dealCards: SpiderCard[] = [];
    for (let i = 0; i < 10; i++) {
      dealCards.push({
        ...deck[deckCursor++],
        faceUp: true,
      });
    }
    stock.push(dealCards);
  }

  return {
    suitMode,
    columns,
    stock,
    completedSuits: [],
    moves: 0,
    history: [],
    hint: null,
  };
};

export const cloneColumns = (columns: SpiderCard[][]): SpiderCard[][] =>
  columns.map((col) => col.map((card) => ({ ...card })));

export const cloneStock = (stock: SpiderCard[][]): SpiderCard[][] =>
  stock.map((deal) => deal.map((card) => ({ ...card })));

export const isMovableRun = (column: SpiderCard[], startIndex: number): boolean => {
  if (startIndex < 0 || startIndex >= column.length) {
    return false;
  }

  const firstCard = column[startIndex];
  if (!firstCard.faceUp) {
    return false;
  }

  for (let i = startIndex; i < column.length - 1; i++) {
    const current = column[i];
    const next = column[i + 1];
    if (!current.faceUp || !next.faceUp) {
      return false;
    }
    if (current.suit !== next.suit || current.rank !== next.rank + 1) {
      return false;
    }
  }

  return true;
};

export const canDropRunOnColumn = (
  movingRun: SpiderCard[],
  targetColumn: SpiderCard[],
): boolean => {
  if (movingRun.length === 0) {
    return false;
  }

  if (targetColumn.length === 0) {
    return true;
  }

  const targetBottomCard = targetColumn[targetColumn.length - 1];
  if (!targetBottomCard.faceUp) {
    return false;
  }

  const movingTopCard = movingRun[0];
  return targetBottomCard.rank === movingTopCard.rank + 1;
};

/**
 * Checks all columns for any completed King-to-Ace same-suit sequences at the end of a column.
 * Removes completed runs, adds their suit to `completedSuits`, and flips any newly exposed card.
 */
export const extractCompletedRuns = (
  columns: SpiderCard[][],
  completedSuits: Suit[],
): { columns: SpiderCard[][]; completedSuits: Suit[] } => {
  const nextColumns = cloneColumns(columns);
  const nextCompleted = [ ...completedSuits ];

  for (let colIdx = 0; colIdx < nextColumns.length; colIdx++) {
    let checked = true;
    while (checked) {
      checked = false;
      const col = nextColumns[colIdx];

      // First flip exposed bottom card if face-down
      if (col.length > 0 && !col[col.length - 1].faceUp) {
        col[col.length - 1].faceUp = true;
      }

      if (col.length >= 13) {
        const startIdx = col.length - 13;
        const candidate = col.slice(startIdx);
        const targetSuit = candidate[0].suit;
        const isCompleteKingToAce = candidate.every(
          (card, idx) =>
            card.faceUp && card.suit === targetSuit && card.rank === 13 - idx,
        );

        if (isCompleteKingToAce) {
          col.splice(startIdx, 13);
          nextCompleted.push(targetSuit);
          if (col.length > 0 && !col[col.length - 1].faceUp) {
            col[col.length - 1].faceUp = true;
          }
          checked = true;
        }
      }
    }
  }

  return { columns: nextColumns, completedSuits: nextCompleted };
};

export const findBestDestinationColumn = (
  columns: SpiderCard[][],
  fromCol: number,
  cardIndex: number,
): number | null => {
  const sourceCol = columns[fromCol];
  if (!sourceCol || !isMovableRun(sourceCol, cardIndex)) {
    return null;
  }

  const movingRun = sourceCol.slice(cardIndex);
  const movingTop = movingRun[0];

  let bestCol: number | null = null;
  let bestScore = -1;

  for (let toCol = 0; toCol < columns.length; toCol++) {
    if (toCol === fromCol) continue;
    const targetCol = columns[toCol];
    if (!canDropRunOnColumn(movingRun, targetCol)) continue;

    let score = 0;
    if (targetCol.length === 0) {
      score = 10;
    } else {
      const targetBottom = targetCol[targetCol.length - 1];
      // Prefer same-suit connection, and prefer longer existing same-suit runs
      if (targetBottom.suit === movingTop.suit) {
        score = 100;
      } else {
        score = 50;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCol = toCol;
    }
  }

  return bestCol;
};

export const findHintMove = (state: SpiderGameState): SpiderMoveHint | null => {
  const { columns, stock } = state;
  let bestHint: SpiderMoveHint | null = null;
  let bestPriority = -1;

  for (let fromCol = 0; fromCol < columns.length; fromCol++) {
    const col = columns[fromCol];
    if (col.length === 0) continue;

    // Find the highest (earliest) index of the current bottom movable run
    let runStart = col.length - 1;
    while (runStart > 0 && isMovableRun(col, runStart - 1)) {
      runStart--;
    }

    const movingRun = col.slice(runStart);
    const movingTop = movingRun[0];
    const cardBelowMove = runStart > 0 ? col[runStart - 1] : null;

    for (let toCol = 0; toCol < columns.length; toCol++) {
      if (toCol === fromCol) continue;
      const targetCol = columns[toCol];
      if (!canDropRunOnColumn(movingRun, targetCol)) continue;

      // Avoid pointless moves (e.g., moving an entire column onto another empty column)
      if (targetCol.length === 0 && runStart === 0) {
        continue;
      }

      const targetBottom = targetCol[targetCol.length - 1];
      let priority = 0;

      if (targetBottom) {
        // Avoid lateral moves that break an already connected same-suit run unless moving onto another same-suit run
        if (
          cardBelowMove &&
          cardBelowMove.faceUp &&
          cardBelowMove.suit === movingTop.suit &&
          cardBelowMove.rank === movingTop.rank + 1
        ) {
          continue;
        }

        if (targetBottom.suit === movingTop.suit) {
          priority = 90;
        } else if (cardBelowMove && !cardBelowMove.faceUp) {
          priority = 70;
        } else if (
          cardBelowMove &&
          cardBelowMove.faceUp &&
          cardBelowMove.rank === movingTop.rank + 1
        ) {
          // Moving from one off-suit parent to another off-suit parent provides no progress
          continue;
        } else {
          priority = 40;
        }
      } else {
        // Moving to an empty column is helpful if it reveals a face-down card or splits an off-suit stack
        if (cardBelowMove && !cardBelowMove.faceUp) {
          priority = 65;
        } else {
          priority = 25;
        }
      }

      if (priority > bestPriority) {
        bestPriority = priority;
        bestHint = { fromCol, cardIndex: runStart, toCol };
      }
    }
  }

  if (bestHint) {
    return bestHint;
  }

  if (stock.length > 0) {
    return { fromCol: -1, cardIndex: -1, toCol: 'stock' };
  }

  return null;
};

// Jotai Atoms
export const spiderGameAtom = atom<SpiderGameState>(createInitialGameState(1));
export const spiderNoticeAtom = atom<{ title: string; message: string } | null>(null);
export const spiderElapsedSecondsAtom = atom<number>(0);

export const spiderStatsAtom = atom((get) => {
  const game = get(spiderGameAtom);
  const completedCount = game.completedSuits.length;
  const hasWon = completedCount === 8;
  const score = Math.max(0, 500 - game.moves + completedCount * 100);
  const hasEmptyColumn = game.columns.some((col) => col.length === 0);
  const totalTableauCards = game.columns.reduce((sum, col) => sum + col.length, 0);

  return {
    suitMode: game.suitMode,
    moves: game.moves,
    score,
    completedCount,
    completedSuits: game.completedSuits,
    dealsRemaining: game.stock.length,
    canUndo: game.history.length > 0,
    canDealStock:
      game.stock.length > 0 && (!hasEmptyColumn || totalTableauCards < 10),
    hasEmptyColumn,
    hasWon,
  };
});

export const startNewSpiderGameAtom = atom(
  null,
  (get, set, suitMode?: SpiderSuitMode) => {
    const nextMode = suitMode ?? get(spiderGameAtom).suitMode;
    set(spiderGameAtom, createInitialGameState(nextMode));
    set(spiderNoticeAtom, null);
    set(spiderElapsedSecondsAtom, 0);
  },
);

export const moveSpiderCardsAtom = atom(
  null,
  (
    get,
    set,
    {
      fromCol,
      cardIndex,
      toCol,
    }: { fromCol: number; cardIndex: number; toCol: number },
  ) => {
    if (fromCol === toCol) return false;
    const game = get(spiderGameAtom);
    const sourceColumn = game.columns[fromCol];
    const targetColumn = game.columns[toCol];

    if (!sourceColumn || !targetColumn || !isMovableRun(sourceColumn, cardIndex)) {
      return false;
    }

    const movingRun = sourceColumn.slice(cardIndex);
    if (!canDropRunOnColumn(movingRun, targetColumn)) {
      return false;
    }

    const snapshot: SpiderSnapshot = {
      columns: cloneColumns(game.columns),
      stock: cloneStock(game.stock),
      completedSuits: [ ...game.completedSuits ],
      moves: game.moves,
    };

    const nextColumns = cloneColumns(game.columns);
    const extracted = nextColumns[fromCol].splice(cardIndex);
    nextColumns[toCol].push(...extracted);

    const { columns: cleanedColumns, completedSuits: nextCompleted } =
      extractCompletedRuns(nextColumns, game.completedSuits);

    set(spiderGameAtom, {
      ...game,
      columns: cleanedColumns,
      completedSuits: nextCompleted,
      moves: game.moves + 1,
      history: [ ...game.history, snapshot ],
      hint: null,
    });
    set(spiderNoticeAtom, null);
    return true;
  },
);

export const dealSpiderStockAtom = atom(null, (get, set) => {
  const game = get(spiderGameAtom);
  if (game.stock.length === 0) {
    return;
  }

  const totalTableauCards = game.columns.reduce((sum, col) => sum + col.length, 0);
  const hasEmptyColumn = game.columns.some((col) => col.length === 0);

  if (hasEmptyColumn && totalTableauCards >= 10) {
    set(spiderNoticeAtom, {
      title: 'Empty Column Blocked',
      message: 'Every tableau column must contain at least one card before dealing from the stock.',
    });
    return;
  }

  const snapshot: SpiderSnapshot = {
    columns: cloneColumns(game.columns),
    stock: cloneStock(game.stock),
    completedSuits: [ ...game.completedSuits ],
    moves: game.moves,
  };

  const nextStock = cloneStock(game.stock);
  const dealCards = nextStock.pop()!;
  const nextColumns = cloneColumns(game.columns);

  for (let colIdx = 0; colIdx < 10; colIdx++) {
    const card = dealCards[colIdx];
    if (card) {
      nextColumns[colIdx].push({ ...card, faceUp: true });
    }
  }

  const { columns: cleanedColumns, completedSuits: nextCompleted } =
    extractCompletedRuns(nextColumns, game.completedSuits);

  set(spiderGameAtom, {
    ...game,
    columns: cleanedColumns,
    stock: nextStock,
    completedSuits: nextCompleted,
    moves: game.moves + 1,
    history: [ ...game.history, snapshot ],
    hint: null,
  });
  set(spiderNoticeAtom, null);
});

export const undoSpiderMoveAtom = atom(null, (get, set) => {
  const game = get(spiderGameAtom);
  if (game.history.length === 0) {
    return;
  }

  const nextHistory = [ ...game.history ];
  const previous = nextHistory.pop()!;

  set(spiderGameAtom, {
    ...game,
    columns: previous.columns,
    stock: previous.stock,
    completedSuits: previous.completedSuits,
    moves: game.moves + 1,
    history: nextHistory,
    hint: null,
  });
  set(spiderNoticeAtom, null);
});

export const triggerSpiderHintAtom = atom(null, (get, set) => {
  const game = get(spiderGameAtom);
  const hint = findHintMove(game);

  if (!hint) {
    set(spiderNoticeAtom, {
      title: 'No Moves Found',
      message: 'No constructive moves remain. Try undoing a move or starting a new deal.',
    });
    return;
  }

  set(spiderGameAtom, {
    ...game,
    hint,
  });

  if (hint.toCol === 'stock') {
    set(spiderNoticeAtom, {
      title: 'Deal Next Row',
      message: 'No direct tableau merges found — deal a new row from the stock pile.',
    });
  } else {
    set(spiderNoticeAtom, null);
  }
});
