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

export const FloatingStockDeck = ({
  dealsRemaining,
  canDeal,
  isDealing,
  isHintTarget = false,
  onDeal,
  deckRef,
}: {
  readonly dealsRemaining: number;
  readonly canDeal: boolean;
  readonly isDealing: boolean;
  readonly isHintTarget?: boolean;
  readonly onDeal: () => void;
  readonly deckRef?: React.Ref<HTMLButtonElement>;
}) => {
  const isDisabled = dealsRemaining === 0 || isDealing;

  let deckTitle = `Deal 10 cards (${dealsRemaining} remaining) — Press 'D'`;
  if (dealsRemaining === 0) {
    deckTitle = "No stock deals remaining";
  } else if (!canDeal) {
    deckTitle = "Fill all empty columns before dealing from stock";
  }

  let buttonStateClass =
    "border-border bg-card text-foreground hover:border-foreground cursor-pointer hover:-translate-y-1 hover:shadow-xl active:translate-y-0";
  if (isDisabled) {
    buttonStateClass =
      "border-border/60 bg-secondary/20 text-muted-foreground/40 cursor-not-allowed border-dashed";
  } else if (isHintTarget) {
    buttonStateClass =
      "border-chart-3 bg-card text-foreground ring-chart-3/50 cursor-pointer shadow-xl ring-2 hover:-translate-y-1";
  } else if (!canDeal) {
    buttonStateClass =
      "border-border/80 bg-secondary/40 text-muted-foreground cursor-not-allowed";
  }

  return (
    <div className="fixed right-4 bottom-4 z-30 select-none sm:right-6 sm:bottom-6">
      <button
        ref={deckRef}
        type="button"
        disabled={isDisabled}
        onClick={onDeal}
        aria-label={
          dealsRemaining === 0
            ? "Stock deck is empty"
            : `Deal 10 cards from stock (${dealsRemaining} deals remaining, keyboard shortcut D)`
        }
        title={deckTitle}
        className={cn(
          "group relative flex h-24 w-18 flex-col items-center justify-between border p-2 shadow-lg transition-all sm:h-28 sm:w-20",
          buttonStateClass
        )}
      >
        {/* Layered Deck Effect under the top card */}
        {dealsRemaining > 1 ? (
          <>
            <span
              aria-hidden="true"
              className="border-border bg-secondary/80 pointer-events-none absolute inset-0 -translate-x-1 -translate-y-1 -rotate-3 border shadow-xs"
            />
            {dealsRemaining > 2 ? (
              <span
                aria-hidden="true"
                className="border-border bg-secondary/70 pointer-events-none absolute inset-0 -translate-x-2 -translate-y-2 -rotate-6 border shadow-xs"
              />
            ) : null}
          </>
        ) : null}

        {/* Card Front / Pattern Face */}
        {dealsRemaining > 0 ? (
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-between">
            <div className="flex w-full items-center justify-between">
              <StackIcon
                className={cn(
                  "size-3.5",
                  canDeal ? "text-chart-3" : "text-muted-foreground/50"
                )}
                weight="duotone"
              />
              <span className="bg-foreground text-background px-1 py-0.5 font-mono text-[10px] leading-none font-bold">
                {dealsRemaining}
              </span>
            </div>

            <div className="flex flex-col items-center text-center">
              <span className="font-heading text-xs font-bold tracking-wider uppercase">
                {isDealing ? "Dealing…" : "Stock"}
              </span>
              <span className="text-muted-foreground font-mono text-[9px] tracking-tight">
                [Key: D]
              </span>
            </div>

            <div className="border-border/60 bg-secondary/50 flex w-full items-center justify-center border py-0.5 text-[9px] font-medium uppercase">
              {canDeal ? "+10 Cards" : "Fill Holes"}
            </div>
          </div>
        ) : (
          <div className="relative z-10 grid h-full w-full place-items-center text-center">
            <span className="text-muted-foreground/50 font-mono text-[10px] uppercase">
              Deck Empty
            </span>
          </div>
        )}
      </button>
    </div>
  );
};
