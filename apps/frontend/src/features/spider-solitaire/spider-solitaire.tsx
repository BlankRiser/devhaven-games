"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import NumberFlow from "@number-flow/react";
import {
  ArrowCounterClockwiseIcon,
  ArrowUUpLeftIcon,
  CheckCircleIcon,
  LightbulbIcon,
  TimerIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  FullscreenToggleButton,
  useGameFullscreen,
} from "@/features/common/use-game-fullscreen";
import { cn } from "@/lib/utils";
import {
  CompletedFoundationsBar,
  FloatingStockDeck,
  SpiderPlayingCardView,
  StockPileButton,
} from "./spider-solitaire-assets";
import {
  applySpiderStockDealAtom,
  canDropRunOnColumn,
  findBestDestinationColumn,
  isMovableRun,
  moveSpiderCardsAtom,
  prepareOptimalStockDeal,
  spiderElapsedSecondsAtom,
  spiderGameAtom,
  spiderNoticeAtom,
  spiderStatsAtom,
  startNewSpiderGameAtom,
  SUIT_MODES,
  triggerSpiderHintAtom,
  undoSpiderMoveAtom,
} from "./spider-solitaire-utils";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { SpiderCard, SpiderMoveHint } from "./spider-solitaire-utils";

interface ActiveSelection {
  fromCol: number;
  cardIndex: number;
  moveStamp?: string;
}

export default function SpiderSolitaire() {
  const { containerRef, isFullscreen, toggleFullscreen } = useGameFullscreen();

  const game = useAtomValue(spiderGameAtom);
  const stats = useAtomValue(spiderStatsAtom);
  const [notice, setNotice] = useAtom(spiderNoticeAtom);
  const [elapsedSeconds, setElapsedSeconds] = useAtom(spiderElapsedSecondsAtom);

  const startNewGame = useSetAtom(startNewSpiderGameAtom);
  const moveCards = useSetAtom(moveSpiderCardsAtom);
  const applyStockDeal = useSetAtom(applySpiderStockDealAtom);
  const undoMove = useSetAtom(undoSpiderMoveAtom);
  const triggerHint = useSetAtom(triggerSpiderHintAtom);

  const currentMoveStamp = `${game.suitMode}-${game.moves}`;
  const [activeDrag, setActiveDrag] = React.useState<ActiveSelection | null>(
    null
  );
  const [rawSelectedRun, setSelectedRun] =
    React.useState<ActiveSelection | null>(null);
  const selectedRun =
    rawSelectedRun?.moveStamp === currentMoveStamp ? rawSelectedRun : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Auto-dismiss notice toast
  React.useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 3200);
    return () => {
      window.clearTimeout(timer);
    };
  }, [notice, setNotice]);

  // Live timer once the player makes their first move
  React.useEffect(() => {
    if (stats.moves === 0 || stats.hasWon) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((previous) => previous + 1);
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [stats.moves, stats.hasWon, setElapsedSeconds]);

  const [isDealing, setIsDealing] = React.useState(false);
  const [flyingCards, setFlyingCards] = React.useState<{
    cards: SpiderCard[];
    origin: { x: number; y: number };
    destinations: { x: number; y: number; width: number; height: number }[];
  } | null>(null);

  const stockDeckReference = React.useRef<HTMLButtonElement | null>(null);
  const columnReferences = React.useRef<(HTMLDivElement | null)[]>([]);
  const dealTimeoutReference = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (dealTimeoutReference.current !== null) {
        window.clearTimeout(dealTimeoutReference.current);
      }
    };
  }, []);

  const handleDealStock = React.useCallback(() => {
    if (isDealing) {
      return;
    }

    if (stats.dealsRemaining === 0) {
      setNotice({
        title: "No Cards Remaining",
        message:
          "The stock pile is empty. Continue playing with the cards on the board.",
      });
      return;
    }

    if (!stats.canDealStock) {
      setNotice({
        title: "Empty Column Blocked",
        message:
          "Every tableau column must contain at least one card before dealing from the stock.",
      });
      return;
    }

    const prepared = prepareOptimalStockDeal(
      game.columns,
      game.stock,
      game.suitMode
    );

    if (!prepared) {
      return;
    }

    // Measure origin (bottom right floating deck or viewport fallback)
    const deckRect = stockDeckReference.current?.getBoundingClientRect();
    const origin = deckRect
      ? { x: deckRect.left, y: deckRect.top }
      : { x: window.innerWidth - 100, y: window.innerHeight - 130 };

    // Measure destinations for each column
    const destinations: {
      x: number;
      y: number;
      width: number;
      height: number;
    }[] = [];

    for (let index = 0; index < 10; index += 1) {
      const colElement = columnReferences.current[index];
      const colCards = game.columns[index] ?? [];
      const faceUpStep = colCards.length > 13 ? 22 : 28;
      const faceDownStep = 12;
      let topOffset = 0;
      for (const card of colCards) {
        topOffset += card.faceUp ? faceUpStep : faceDownStep;
      }

      if (colElement) {
        const colRect = colElement.getBoundingClientRect();
        const cardWidth = Math.max(60, colRect.width - 4);
        let cardHeight = 88;
        if (colRect.width > 100) {
          cardHeight = 128;
        } else if (colRect.width > 80) {
          cardHeight = 112;
        }
        const targetY = Math.min(
          colRect.top + topOffset,
          window.innerHeight - 120
        );
        destinations.push({
          x: colRect.left + 2,
          y: targetY,
          width: cardWidth,
          height: cardHeight,
        });
      } else {
        destinations.push({
          x: (window.innerWidth / 10) * index + 8,
          y: Math.min(220 + topOffset, window.innerHeight - 120),
          width: 80,
          height: 112,
        });
      }
    }

    setIsDealing(true);
    setSelectedRun(null);
    setNotice(null);
    setFlyingCards({
      cards: prepared.dealCards,
      origin,
      destinations,
    });

    dealTimeoutReference.current = window.setTimeout(() => {
      applyStockDeal({
        dealCards: prepared.dealCards,
        nextStock: prepared.nextStock,
      });
      setFlyingCards(null);
      setIsDealing(false);
    }, 780);
  }, [
    applyStockDeal,
    game.columns,
    game.stock,
    game.suitMode,
    isDealing,
    setNotice,
    stats.canDealStock,
    stats.dealsRemaining,
  ]);

  // Keyboard shortcuts: Z to undo, H for hint, D to deal stock
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "z") {
        event.preventDefault();
        undoMove();
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      switch (key) {
        case "z": {
          event.preventDefault();
          undoMove();

          break;
        }
        case "h": {
          event.preventDefault();
          triggerHint();

          break;
        }
        case "d": {
          event.preventDefault();
          handleDealStock();

          break;
        }
        case "escape": {
          setSelectedRun(null);

          break;
        }
        // No default
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleDealStock, triggerHint, undoMove]);

  const activeSource = activeDrag ?? selectedRun;
  const activeMovingCards = React.useMemo(() => {
    if (!activeSource) {
      return [];
    }
    const col = game.columns[activeSource.fromCol];
    return col ? col.slice(activeSource.cardIndex) : [];
  }, [activeSource, game.columns]);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as
      { fromCol: number; cardIndex: number } | undefined;
    if (!data) {
      return;
    }
    setSelectedRun(null);
    setActiveDrag({ fromCol: data.fromCol, cardIndex: data.cardIndex });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const currentDrag = activeDrag;
    setActiveDrag(null);

    if (!currentDrag || !event.over) {
      return;
    }

    const overData = event.over.data.current as
      { colIndex?: number } | undefined;
    if (typeof overData?.colIndex !== "number") {
      return;
    }

    if (overData.colIndex !== currentDrag.fromCol) {
      moveCards({
        fromCol: currentDrag.fromCol,
        cardIndex: currentDrag.cardIndex,
        toCol: overData.colIndex,
      });
    }
  };

  const handleCardClick = (colIndex: number, cardIndex: number) => {
    const col = game.columns[colIndex];
    if (!col) {
      return;
    }

    if (selectedRun && selectedRun.fromCol !== colIndex) {
      const isMoved = moveCards({
        fromCol: selectedRun.fromCol,
        cardIndex: selectedRun.cardIndex,
        toCol: colIndex,
      });
      if (isMoved) {
        setSelectedRun(null);
        return;
      }
    }

    if (
      selectedRun &&
      selectedRun.fromCol === colIndex &&
      selectedRun.cardIndex === cardIndex
    ) {
      const bestCol = findBestDestinationColumn(
        game.columns,
        colIndex,
        cardIndex
      );
      if (bestCol !== null) {
        moveCards({ fromCol: colIndex, cardIndex, toCol: bestCol });
      }
      setSelectedRun(null);
      return;
    }

    if (isMovableRun(col, cardIndex)) {
      setSelectedRun({
        fromCol: colIndex,
        cardIndex,
        moveStamp: currentMoveStamp,
      });
    } else {
      setSelectedRun(null);
    }
  };

  const handleCardDoubleClick = (colIndex: number, cardIndex: number) => {
    const col = game.columns[colIndex];
    if (!col || !isMovableRun(col, cardIndex)) {
      return;
    }

    const bestCol = findBestDestinationColumn(
      game.columns,
      colIndex,
      cardIndex
    );
    if (bestCol === null) {
      return;
    }

    moveCards({ fromCol: colIndex, cardIndex, toCol: bestCol });
    setSelectedRun(null);
  };

  const handleEmptyColumnClick = (colIndex: number) => {
    if (!selectedRun || selectedRun.fromCol === colIndex) {
      return;
    }
    moveCards({
      fromCol: selectedRun.fromCol,
      cardIndex: selectedRun.cardIndex,
      toCol: colIndex,
    });
    setSelectedRun(null);
  };

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  return (
    <section
      ref={containerRef}
      className="bg-background relative flex h-full w-full flex-1 flex-col overflow-hidden"
    >
      {/* Unified Top Control & Telemetry HUD Bar */}
      <div className="border-border bg-card z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2 text-xs uppercase">
        {/* Left: Score, Moves, Runs, Time, Completed Foundations */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] leading-none">
              Score
            </span>
            <span className="text-foreground font-mono text-sm font-bold">
              <NumberFlow value={stats.score} />
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] leading-none">
              Moves
            </span>
            <span className="text-foreground font-mono text-sm font-bold">
              <NumberFlow value={stats.moves} />
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] leading-none">
              Runs
            </span>
            <span className="text-foreground font-mono text-sm font-bold">
              <NumberFlow value={stats.completedCount} /> / 8
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <TimerIcon className="text-muted-foreground size-4" />
            <div className="flex flex-col">
              <span className="text-muted-foreground text-[10px] leading-none">
                Time
              </span>
              <span className="text-foreground font-mono text-sm font-bold">
                {String(minutes).padStart(2, "0")}:
                {String(seconds).padStart(2, "0")}
              </span>
            </div>
          </div>

          <CompletedFoundationsBar completedSuits={stats.completedSuits} />
        </div>

        {/* Right: Suit Difficulty + Stock Deal + Undo/Hint/New Deal + Fullscreen */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {SUIT_MODES.map((preset) => {
              const isActive = stats.suitMode === preset.mode;
              return (
                <button
                  key={preset.mode}
                  type="button"
                  onClick={() => {
                    startNewGame(preset.mode);
                  }}
                  title={preset.description}
                  className={cn(
                    "h-7 border px-2.5 text-[11px] font-medium tracking-wider uppercase transition-colors",
                    isActive
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <span className="hidden md:inline">{preset.label}</span>
                  <span className="md:hidden">{preset.shortLabel}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <StockPileButton
              dealsRemaining={stats.dealsRemaining}
              canDeal={stats.canDealStock}
              isHintTarget={game.hint?.toCol === "stock"}
              onDeal={handleDealStock}
            />

            <Button
              variant="outline"
              size="sm"
              disabled={!stats.canUndo}
              onClick={() => {
                undoMove();
              }}
              title="Undo last move (Shortcut: Z or Cmd+Z)"
              className="h-7 gap-1.5 px-2.5 text-[11px]"
            >
              <ArrowUUpLeftIcon className="size-3.5" />
              <span>Undo</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={stats.hasWon}
              onClick={() => {
                triggerHint();
              }}
              title="Highlight a suggested move (Shortcut: H)"
              className="h-7 gap-1.5 px-2.5 text-[11px]"
            >
              <LightbulbIcon className="text-chart-3 size-3.5" weight="fill" />
              <span>Hint</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                startNewGame();
              }}
              title="Deal a fresh game"
              className="h-7 gap-1.5 px-2.5 text-[11px]"
            >
              <ArrowCounterClockwiseIcon className="size-3.5" />
              <span>New Deal</span>
            </Button>

            <FullscreenToggleButton
              isFullscreen={isFullscreen}
              onToggle={toggleFullscreen}
            />
          </div>
        </div>
      </div>

      {/* Notice / Hint Alert */}
      <AnimatePresence>
        {notice ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="border-border z-10 shrink-0 border-b"
          >
            <Alert className="rounded-none border-0 py-2">
              <WarningCircleIcon className="text-chart-3 size-4" />
              <AlertTitle className="text-xs font-bold uppercase">
                {notice.title}
              </AlertTitle>
              <AlertDescription className="text-xs">
                {notice.message}
              </AlertDescription>
            </Alert>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Victory Banner */}
      <AnimatePresence>
        {stats.hasWon ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-foreground bg-accent text-accent-foreground z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5"
          >
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="size-5 shrink-0" weight="fill" />
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-heading text-base leading-none font-bold uppercase">
                  All 8 Suit Runs Completed!
                </span>
                <span className="text-xs opacity-85">
                  Final Score: {stats.score} · Completed in {stats.moves} moves
                  ({minutes}m {seconds}s).
                </span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                startNewGame();
              }}
              className="h-7 text-xs"
            >
              Play Again
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Full-Width 10-Column Spider Tableau */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setActiveDrag(null);
        }}
      >
        <div className="bg-card/30 min-h-0 w-full flex-1 overflow-auto p-2 pb-32 sm:p-4 sm:pb-36">
          <div className="grid h-full min-w-[720px] grid-cols-10 gap-1.5 sm:gap-2.5 lg:gap-3">
            {game.columns.map((column, colIndex) => {
              const isValidTarget =
                activeSource !== null &&
                activeSource.fromCol !== colIndex &&
                canDropRunOnColumn(activeMovingCards, column);

              return (
                <TableauColumn
                  key={colIndex}
                  colIndex={colIndex}
                  cards={column}
                  activeDrag={activeDrag}
                  selectedRun={selectedRun}
                  hint={game.hint}
                  isValidTarget={isValidTarget}
                  onMountColumnRef={(element) => {
                    columnReferences.current[colIndex] = element;
                  }}
                  onCardClick={handleCardClick}
                  onCardDoubleClick={handleCardDoubleClick}
                  onEmptyColumnClick={handleEmptyColumnClick}
                />
              );
            })}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDrag && activeMovingCards.length > 0 ? (
            <div className="relative w-20 sm:w-28 lg:w-32">
              {activeMovingCards.map((card, index) => (
                <div
                  key={card.id}
                  style={{
                    position: index === 0 ? "relative" : "absolute",
                    top: index === 0 ? 0 : index * 26,
                    left: 0,
                    right: 0,
                    zIndex: index + 1,
                  }}
                >
                  <SpiderPlayingCardView card={card} isMovable isOverlay />
                </div>
              ))}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Floating 3D Stock Deck (Bottom-Right Corner) */}
      <FloatingStockDeck
        deckRef={stockDeckReference}
        dealsRemaining={stats.dealsRemaining}
        canDeal={stats.canDealStock}
        isDealing={isDealing}
        isHintTarget={game.hint?.toCol === "stock"}
        onDeal={handleDealStock}
      />

      {/* Animated Stock Deal Flying Cards Overlay */}
      {flyingCards ? (
        <div
          className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
          aria-hidden="true"
        >
          {flyingCards.cards.map((card, index) => {
            const destination = flyingCards.destinations[index];
            if (!destination) {
              return null;
            }

            return (
              <motion.div
                key={`deal-fly-${card.id}`}
                initial={{
                  x: flyingCards.origin.x,
                  y: flyingCards.origin.y,
                  scale: 0.75,
                  rotate: 15,
                  opacity: 0.85,
                }}
                animate={{
                  x: [flyingCards.origin.x, destination.x],
                  y: [
                    flyingCards.origin.y,
                    Math.min(flyingCards.origin.y, destination.y) - 60,
                    destination.y,
                  ],
                  scale: [0.75, 1.05, 1],
                  rotate: [15, -4, 0],
                  opacity: [0.85, 1, 1],
                }}
                transition={{
                  delay: index * 0.04,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  width: destination.width,
                  height: destination.height,
                }}
                className="fixed top-0 left-0 shadow-2xl"
              >
                <SpiderPlayingCardView
                  card={card}
                  isMovable={false}
                  isOverlay
                />
              </motion.div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

const TableauColumn = ({
  colIndex,
  cards,
  activeDrag,
  selectedRun,
  hint,
  isValidTarget,
  onMountColumnRef,
  onCardClick,
  onCardDoubleClick,
  onEmptyColumnClick,
}: {
  readonly colIndex: number;
  readonly cards: SpiderCard[];
  readonly activeDrag: ActiveSelection | null;
  readonly selectedRun: ActiveSelection | null;
  readonly hint: SpiderMoveHint | null;
  readonly isValidTarget: boolean;
  readonly onMountColumnRef?: (element: HTMLDivElement | null) => void;
  readonly onCardClick: (colIndex: number, cardIndex: number) => void;
  readonly onCardDoubleClick: (colIndex: number, cardIndex: number) => void;
  readonly onEmptyColumnClick: (colIndex: number) => void;
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `col-${colIndex}`,
    data: { colIndex },
  });

  const isHintTarget = hint?.toCol === colIndex;

  const faceUpStep = cards.length > 13 ? 22 : 28;
  const faceDownStep = 12;

  const cardTopOffsets: number[] = [];
  let currentTop = 0;
  for (const card of cards) {
    cardTopOffsets.push(currentTop);
    currentTop += card.faceUp ? faceUpStep : faceDownStep;
  }

  const columnHeight =
    cards.length === 0 ? 128 : cardTopOffsets[cards.length - 1] + 132;

  return (
    <div
      ref={(element) => {
        setNodeRef(element);
        onMountColumnRef?.(element);
      }}
      onClick={() => {
        if (cards.length === 0) {
          onEmptyColumnClick(colIndex);
        }
      }}
      style={{ minHeight: Math.max(420, columnHeight + 16) }}
      className={cn(
        "relative flex h-full flex-col border border-transparent p-0.5 transition-colors",
        isOver && isValidTarget && "border-foreground bg-accent/35",
        !isOver &&
          isValidTarget &&
          "border-foreground/40 bg-accent/15 border-dashed",
        isHintTarget && "border-chart-3 bg-accent/25 border-2"
      )}
    >
      {/* Empty Column Slot */}
      {cards.length === 0 && (
        <div
          className={cn(
            "grid h-22 w-full place-items-center border border-dashed font-mono text-[10px] tracking-widest uppercase transition-colors sm:h-28 lg:h-32",
            isValidTarget || isHintTarget
              ? "border-foreground bg-accent/30 text-foreground cursor-pointer"
              : "border-border bg-secondary/20 text-muted-foreground/40"
          )}
        >
          Empty
        </div>
      )}

      {/* Cascading Cards */}
      {cards.map((card, cardIndex) => {
        const isMovable = isMovableRun(cards, cardIndex);
        const isBeingDragged =
          activeDrag !== null &&
          activeDrag.fromCol === colIndex &&
          cardIndex >= activeDrag.cardIndex;
        const isSelected =
          selectedRun !== null &&
          selectedRun.fromCol === colIndex &&
          cardIndex >= selectedRun.cardIndex;
        const isHintSource =
          hint !== null &&
          hint.fromCol === colIndex &&
          cardIndex >= hint.cardIndex;

        return (
          <DraggableTableauCard
            key={card.id}
            card={card}
            colIndex={colIndex}
            cardIndex={cardIndex}
            topOffset={cardTopOffsets[cardIndex]}
            isMovable={isMovable}
            isBeingDragged={isBeingDragged}
            isSelected={isSelected}
            isHintSource={isHintSource}
            onClick={() => {
              onCardClick(colIndex, cardIndex);
            }}
            onDoubleClick={() => {
              onCardDoubleClick(colIndex, cardIndex);
            }}
          />
        );
      })}
    </div>
  );
};

const DraggableTableauCard = ({
  card,
  colIndex,
  cardIndex,
  topOffset,
  isMovable,
  isBeingDragged,
  isSelected,
  isHintSource,
  onClick,
  onDoubleClick,
}: {
  readonly card: SpiderCard;
  readonly colIndex: number;
  readonly cardIndex: number;
  readonly topOffset: number;
  readonly isMovable: boolean;
  readonly isBeingDragged: boolean;
  readonly isSelected: boolean;
  readonly isHintSource: boolean;
  readonly onClick: () => void;
  readonly onDoubleClick: () => void;
}) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: card.id,
    data: { fromCol: colIndex, cardIndex, colIndex },
    disabled: !isMovable,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        top: topOffset,
        left: 2,
        right: 2,
        zIndex: cardIndex + 1,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      className={cn(
        "transition-transform duration-150",
        isMovable ? "cursor-grab active:cursor-grabbing" : "cursor-default",
        isBeingDragged && "pointer-events-none opacity-20"
      )}
      {...(isMovable ? listeners : {})}
      {...(isMovable ? attributes : {})}
    >
      <SpiderPlayingCardView
        card={card}
        isMovable={isMovable}
        isSelected={isSelected}
        isHintSource={isHintSource}
      />
    </div>
  );
};
