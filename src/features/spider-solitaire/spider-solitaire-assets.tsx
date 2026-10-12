'use client';

import {
  ClubIcon,
  DiamondIcon,
  HeartIcon,
  SpadeIcon,
  StackIcon,
} from '@phosphor-icons/react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  RANK_LABELS,
  type SpiderCard,
  type Suit,
} from './spider-solitaire-utils';

export const SuitGlyph = ({
  suit,
  className,
}: {
  suit: Suit;
  className?: string;
}) => {
  switch (suit) {
    case 'spades':
      return <SpadeIcon weight="fill" className={className} />;
    case 'hearts':
      return <HeartIcon weight="fill" className={className} />;
    case 'clubs':
      return <ClubIcon weight="fill" className={className} />;
    case 'diamonds':
      return <DiamondIcon weight="fill" className={className} />;
  }
};

export const isRedSuit = (suit: Suit): boolean =>
  suit === 'hearts' || suit === 'diamonds';

export const SpiderPlayingCardView = ({
  card,
  isMovable = true,
  isSelected = false,
  isHintSource = false,
  isOverlay = false,
  className,
}: {
  card: SpiderCard;
  isMovable?: boolean;
  isSelected?: boolean;
  isHintSource?: boolean;
  isOverlay?: boolean;
  className?: string;
}) => {
  if (!card.faceUp) {
    return (
      <div
        className={cn(
          'relative h-20 w-full select-none border border-border bg-secondary/90 shadow-xs sm:h-24',
          'bg-[radial-gradient(circle_at_center,_var(--color-border)_1px,_transparent_1px)] bg-[size:6px_6px]',
          className,
        )}>
        <div className="absolute inset-1 border border-border/50 bg-secondary/40" />
      </div>
    );
  }

  const red = isRedSuit(card.suit);
  const rankLabel = RANK_LABELS[card.rank];

  return (
    <div
      className={cn(
        'relative flex h-20 w-full select-none flex-col justify-between border p-1.5 transition-colors sm:h-24 sm:p-2',
        isSelected
          ? 'border-2 border-foreground bg-accent text-accent-foreground shadow-md'
          : isHintSource
            ? 'border-2 border-chart-3 bg-accent/80 text-accent-foreground shadow-md'
            : isMovable
              ? 'border-border bg-card text-card-foreground hover:border-foreground/70'
              : 'border-border/80 bg-secondary/55 text-muted-foreground opacity-80',
        isOverlay && 'border-foreground bg-card shadow-xl ring-1 ring-foreground/20',
        className,
      )}>
      {/* Top header row: Rank + Suit */}
      <div
        className={cn(
          'flex items-center justify-between leading-none',
          red
            ? 'text-red-600 dark:text-red-400'
            : 'text-foreground',
        )}>
        <span className="font-heading text-sm leading-none font-bold tracking-tight sm:text-base">
          {rankLabel}
        </span>
        <SuitGlyph suit={card.suit} className="size-3 sm:size-3.5" />
      </div>

      {/* Center large watermark suit */}
      <div
        className={cn(
          'pointer-events-none grid place-items-center opacity-20 sm:opacity-25',
          red
            ? 'text-red-600 dark:text-red-400'
            : 'text-foreground',
        )}>
        <SuitGlyph suit={card.suit} className="size-6 sm:size-8" />
      </div>

      {/* Bottom corner rank + suit */}
      <div
        className={cn(
          'hidden items-center justify-between leading-none sm:flex',
          red
            ? 'text-red-600 dark:text-red-400'
            : 'text-foreground',
        )}>
        <SuitGlyph suit={card.suit} className="size-3 opacity-75" />
        <span className="font-heading text-xs leading-none font-bold">
          {rankLabel}
        </span>
      </div>
    </div>
  );
};

export const CompletedFoundationsBar = ({
  completedSuits,
}: {
  completedSuits: Suit[];
}) => {
  return (
    <div className="flex items-center gap-1" aria-label="Completed suit foundations">
      {Array.from({ length: 8 }).map((_, idx) => {
        const suit = completedSuits[idx];
        const red = suit ? isRedSuit(suit) : false;

        return (
          <div
            key={idx}
            title={
              suit
                ? `Completed ${suit.toUpperCase()} Run (K–A)`
                : `Empty Foundation Slot ${idx + 1}`
            }
            className={cn(
              'grid h-10 w-7 place-items-center border text-xs transition-colors sm:h-11 sm:w-8',
              suit
                ? 'border-foreground bg-accent text-accent-foreground shadow-xs'
                : 'border-dashed border-border bg-secondary/30 text-muted-foreground/35',
            )}>
            {suit ? (
              <div
                className={cn(
                  'flex flex-col items-center leading-none',
                  red ? 'text-red-600 dark:text-red-400' : 'text-foreground',
                )}>
                <span className="font-heading text-[10px] font-bold">K</span>
                <SuitGlyph suit={suit} className="size-3.5" />
              </div>
            ) : (
              <span className="font-mono text-[9px]">{idx + 1}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const StockPileButton = ({
  dealsRemaining,
  canDeal,
  isHintTarget,
  onDeal,
}: {
  dealsRemaining: number;
  canDeal: boolean;
  isHintTarget: boolean;
  onDeal: () => void;
}) => {
  return (
    <button
      type="button"
      disabled={dealsRemaining === 0}
      onClick={onDeal}
      title={
        dealsRemaining === 0
          ? 'No stock deals remaining'
          : canDeal
            ? `Deal 10 cards (${dealsRemaining} deals left) — Shortcut: D`
            : 'Fill all empty columns before dealing from stock'
      }
      className={cn(
        'group relative flex h-10 items-center gap-2 border px-2.5 text-left text-xs transition-colors sm:h-11 sm:px-3',
        dealsRemaining === 0
          ? 'cursor-not-allowed border-dashed border-border bg-secondary/20 text-muted-foreground/40'
          : isHintTarget
            ? 'border-2 border-chart-3 bg-accent text-accent-foreground'
            : 'border-border bg-card text-foreground hover:border-foreground hover:bg-secondary/60',
      )}>
      <StackIcon className="size-4 shrink-0 text-chart-3" weight="duotone" />
      <div className="flex flex-col leading-tight">
        <span className="text-[9px] tracking-wider text-muted-foreground uppercase">
          Stock Pile
        </span>
        <span className="font-mono text-xs font-bold">
          {dealsRemaining} {dealsRemaining === 1 ? 'Deal' : 'Deals'}
        </span>
      </div>
    </button>
  );
};
