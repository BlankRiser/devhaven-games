"use client";

import {
  ClubIcon,
  DiamondIcon,
  HeartIcon,
  SpadeIcon,
  StackIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { RANK_LABELS } from "./spider-solitaire-utils";
import type { SpiderCard, Suit } from "./spider-solitaire-utils";
import type * as React from "react";

export const SuitGlyph = ({
  suit,
  className,
}: {
  readonly suit: Suit;
  readonly className?: string;
}) => {
  switch (suit) {
    case "spades": {
      return <SpadeIcon weight="fill" className={className} />;
    }
    case "hearts": {
      return <HeartIcon weight="fill" className={className} />;
    }
    case "clubs": {
      return <ClubIcon weight="fill" className={className} />;
    }
    case "diamonds": {
      return <DiamondIcon weight="fill" className={className} />;
    }
  }
};

export const isRedSuit = (suit: Suit): boolean =>
  suit === "hearts" || suit === "diamonds";

export const SpiderPlayingCardView = ({
  card,
  isMovable = true,
  isSelected = false,
  isHintSource = false,
  isOverlay = false,
  className,
}: {
  readonly card: SpiderCard;
  readonly isMovable?: boolean;
  readonly isSelected?: boolean;
  readonly isHintSource?: boolean;
  readonly isOverlay?: boolean;
  readonly className?: string;
}) => {
  if (!card.faceUp) {
    return (
      <div
        className={cn(
          "border-border bg-secondary/90 relative h-22 w-full border shadow-xs select-none sm:h-28 lg:h-32",
          "bg-[radial-gradient(circle_at_center,_var(--color-border)_1px,_transparent_1px)] bg-[size:6px_6px]",
          className
        )}
      >
        <div className="border-border/50 bg-secondary/40 absolute inset-1 border" />
      </div>
    );
  }

  const isRed = isRedSuit(card.suit);
  const rankLabel = RANK_LABELS[card.rank];

  return (
    <div
      className={cn(
        "relative flex h-22 w-full flex-col justify-between border p-1.5 transition-colors select-none sm:h-28 sm:p-2 lg:h-32 lg:p-2.5",
        isSelected
          ? "border-foreground bg-accent text-accent-foreground border-2 shadow-md"
          : isHintSource
            ? "border-chart-3 bg-accent/80 text-accent-foreground border-2 shadow-md"
            : isMovable
              ? "border-border bg-card text-card-foreground hover:border-foreground/70"
              : "border-border/80 bg-secondary/55 text-muted-foreground opacity-80",
        isOverlay &&
          "border-foreground bg-card ring-foreground/20 shadow-xl ring-1",
        className
      )}
    >
      {/* Top header row: Rank + Suit */}
      <div
        className={cn(
          "flex items-center justify-between leading-none",
          isRed ? "text-red-600 dark:text-red-400" : "text-foreground"
        )}
      >
        <span className="font-heading text-sm leading-none font-bold tracking-tight sm:text-base lg:text-lg">
          {rankLabel}
        </span>
        <SuitGlyph suit={card.suit} className="size-3.5 sm:size-4" />
      </div>

      {/* Center large watermark suit */}
      <div
        className={cn(
          "pointer-events-none grid place-items-center opacity-20 sm:opacity-25",
          isRed ? "text-red-600 dark:text-red-400" : "text-foreground"
        )}
      >
        <SuitGlyph suit={card.suit} className="size-6 sm:size-9 lg:size-10" />
      </div>

      {/* Bottom corner rank + suit */}
      <div
        className={cn(
          "hidden items-center justify-between leading-none sm:flex",
          isRed ? "text-red-600 dark:text-red-400" : "text-foreground"
        )}
      >
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
  readonly completedSuits: Suit[];
}) => (
  <div
    className="hidden items-center gap-1 lg:flex"
    aria-label="Completed suit foundations"
  >
    {Array.from({ length: 8 }).map((_, index) => {
      const suit = completedSuits[index];
      const isRed = suit ? isRedSuit(suit) : false;

      return (
        <div
          key={index}
          title={
            suit
              ? `Completed ${suit.toUpperCase()} Run (K–A)`
              : `Empty Foundation Slot ${index + 1}`
          }
          className={cn(
            "grid h-7 w-6 place-items-center border text-xs transition-colors",
            suit
              ? "border-foreground bg-accent text-accent-foreground shadow-xs"
              : "border-border bg-secondary/30 text-muted-foreground/35 border-dashed"
          )}
        >
          {suit ? (
            <SuitGlyph
              suit={suit}
              className={cn(
                "size-3.5",
                isRed ? "text-red-600 dark:text-red-400" : "text-foreground"
              )}
            />
          ) : (
            <span className="font-mono text-[9px]">{index + 1}</span>
          )}
        </div>
      );
    })}
  </div>
);

export const StockPileButton = ({
  dealsRemaining,
  canDeal,
  isHintTarget,
  onDeal,
}: {
  readonly dealsRemaining: number;
  readonly canDeal: boolean;
  readonly isHintTarget: boolean;
  readonly onDeal: () => void;
}) => (
  <button
    type="button"
    disabled={dealsRemaining === 0}
    onClick={onDeal}
    title={
      dealsRemaining === 0
        ? "No stock deals remaining"
        : canDeal
          ? `Deal 10 cards (${dealsRemaining} deals left) — Shortcut: D`
          : "Fill all empty columns before dealing from stock"
    }
    className={cn(
      "group relative flex h-7 items-center gap-1.5 border px-2.5 text-[11px] font-medium tracking-wider uppercase transition-colors",
      dealsRemaining === 0
        ? "border-border bg-secondary/20 text-muted-foreground/40 cursor-not-allowed border-dashed"
        : isHintTarget
          ? "border-chart-3 bg-accent text-accent-foreground border-2"
          : "border-border bg-card text-foreground hover:border-foreground hover:bg-secondary/60"
    )}
  >
    <StackIcon className="text-chart-3 size-3.5 shrink-0" weight="duotone" />
    <span className="font-mono font-bold">Deal ({dealsRemaining})</span>
  </button>
);
