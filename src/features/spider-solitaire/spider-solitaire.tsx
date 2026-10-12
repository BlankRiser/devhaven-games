'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import NumberFlow from '@number-flow/react';
import {
  ArrowCounterClockwiseIcon,
  ArrowUUpLeftIcon,
  CheckCircleIcon,
  LightbulbIcon,
  TimerIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  FullscreenToggleButton,
  useGameFullscreen,
} from '@/features/common/use-game-fullscreen';
import { cn } from '@/lib/utils';
import {
  CompletedFoundationsBar,
  SpiderPlayingCardView,
  StockPileButton,
} from './spider-solitaire-assets';
import {
  canDropRunOnColumn,
  dealSpiderStockAtom,
  findBestDestinationColumn,
  isMovableRun,
  moveSpiderCardsAtom,
  spiderElapsedSecondsAtom,
  spiderGameAtom,
  spiderNoticeAtom,
  spiderStatsAtom,
  startNewSpiderGameAtom,
  SUIT_MODES,
  triggerSpiderHintAtom,
  undoSpiderMoveAtom,
  type SpiderCard,
  type SpiderMoveHint,
} from './spider-solitaire-utils';

interface ActiveSelection {
  fromCol: number;
  cardIndex: number;
  moveStamp?: string;
}

export default function SpiderSolitaire() {
  const { containerRef, isFullscreen, toggleFullscreen } =
    useGameFullscreen<HTMLElement>();

  const game = useAtomValue(spiderGameAtom);
  const stats = useAtomValue(spiderStatsAtom);
  const [ notice, setNotice ] = useAtom(spiderNoticeAtom);
  const [ elapsedSeconds, setElapsedSeconds ] = useAtom(spiderElapsedSecondsAtom);

  const startNewGame = useSetAtom(startNewSpiderGameAtom);
  const moveCards = useSetAtom(moveSpiderCardsAtom);
  const dealStock = useSetAtom(dealSpiderStockAtom);
  const undoMove = useSetAtom(undoSpiderMoveAtom);
  const triggerHint = useSetAtom(triggerSpiderHintAtom);

  const currentMoveStamp = `${game.suitMode}-${game.moves}`;
  const [ activeDrag, setActiveDrag ] = React.useState<ActiveSelection | null>(null);
  const [ rawSelectedRun, setSelectedRun ] =
    React.useState<ActiveSelection | null>(null);
  const selectedRun =
    rawSelectedRun?.moveStamp === currentMoveStamp ? rawSelectedRun : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // Auto-dismiss notice toast
  React.useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [ notice, setNotice ]);

  // Live timer once the player makes their first move
  React.useEffect(() => {
    if (stats.moves === 0 || stats.hasWon) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [ stats.moves, stats.hasWon, setElapsedSeconds ]);

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
      if ((event.metaKey || event.ctrlKey) && key === 'z') {
        event.preventDefault();
        undoMove();
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (key === 'z') {
        event.preventDefault();
        undoMove();
      } else if (key === 'h') {
        event.preventDefault();
        triggerHint();
      } else if (key === 'd') {
        event.preventDefault();
        dealStock();
      } else if (key === 'escape') {
        setSelectedRun(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ dealStock, triggerHint, undoMove ]);

  const activeSource = activeDrag ?? selectedRun;
  const activeMovingCards = React.useMemo(() => {
    if (!activeSource) return [];
    const col = game.columns[activeSource.fromCol];
    if (!col) return [];
    return col.slice(activeSource.cardIndex);
  }, [ activeSource, game.columns ]);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as
      | { fromCol: number; cardIndex: number }
      | undefined;
    if (!data) return;
    setSelectedRun(null);
    setActiveDrag({ fromCol: data.fromCol, cardIndex: data.cardIndex });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const currentDrag = activeDrag;
    setActiveDrag(null);

    if (!currentDrag || !event.over) {
      return;
    }

    const overData = event.over.data.current as { colIndex?: number } | undefined;
    if (typeof overData?.colIndex !== 'number') {
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
    if (!col) return;

    if (selectedRun && selectedRun.fromCol !== colIndex) {
      const moved = moveCards({
        fromCol: selectedRun.fromCol,
        cardIndex: selectedRun.cardIndex,
        toCol: colIndex,
      });
      if (moved) {
        setSelectedRun(null);
        return;
      }
    }

    if (
      selectedRun &&
      selectedRun.fromCol === colIndex &&
      selectedRun.cardIndex === cardIndex
    ) {
      const bestCol = findBestDestinationColumn(game.columns, colIndex, cardIndex);
      if (bestCol !== null) {
        moveCards({ fromCol: colIndex, cardIndex, toCol: bestCol });
      }
      setSelectedRun(null);
      return;
    }

    if (isMovableRun(col, cardIndex)) {
      setSelectedRun({ fromCol: colIndex, cardIndex, moveStamp: currentMoveStamp });
    } else {
      setSelectedRun(null);
    }
  };

  const handleCardDoubleClick = (colIndex: number, cardIndex: number) => {
    const col = game.columns[colIndex];
    if (!col || !isMovableRun(col, cardIndex)) return;

    const bestCol = findBestDestinationColumn(game.columns, colIndex, cardIndex);
    if (bestCol !== null) {
      moveCards({ fromCol: colIndex, cardIndex, toCol: bestCol });
      setSelectedRun(null);
    }
  };

  const handleEmptyColumnClick = (colIndex: number) => {
    if (!selectedRun || selectedRun.fromCol === colIndex) return;
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
      className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background">
      {/* Unified Top Control & Telemetry HUD Bar */}
      <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-2 text-xs uppercase">
        {/* Left: Score, Moves, Runs, Time, Completed Foundations */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <div className="flex flex-col">
            <span className="text-[10px] leading-none text-muted-foreground">
              Score
            </span>
            <span className="font-mono text-sm font-bold text-foreground">
              <NumberFlow value={stats.score} />
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] leading-none text-muted-foreground">
              Moves
            </span>
            <span className="font-mono text-sm font-bold text-foreground">
              <NumberFlow value={stats.moves} />
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] leading-none text-muted-foreground">
              Runs
            </span>
            <span className="font-mono text-sm font-bold text-foreground">
              <NumberFlow value={stats.completedCount} /> / 8
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <TimerIcon className="size-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-[10px] leading-none text-muted-foreground">
                Time
              </span>
              <span className="font-mono text-sm font-bold text-foreground">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
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
                  onClick={() => startNewGame(preset.mode)}
                  title={preset.description}
                  className={cn(
                    'h-7 border px-2.5 text-[11px] font-medium tracking-wider uppercase transition-colors',
                    isActive
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}>
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
              isHintTarget={game.hint?.toCol === 'stock'}
              onDeal={() => dealStock()}
            />

            <Button
              variant="outline"
              size="sm"
              disabled={!stats.canUndo}
              onClick={() => undoMove()}
              title="Undo last move (Shortcut: Z or Cmd+Z)"
              className="h-7 gap-1.5 px-2.5 text-[11px]">
              <ArrowUUpLeftIcon className="size-3.5" />
              <span>Undo</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={stats.hasWon}
              onClick={() => triggerHint()}
              title="Highlight a suggested move (Shortcut: H)"
              className="h-7 gap-1.5 px-2.5 text-[11px]">
              <LightbulbIcon className="size-3.5 text-chart-3" weight="fill" />
              <span>Hint</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => startNewGame()}
              title="Deal a fresh game"
              className="h-7 gap-1.5 px-2.5 text-[11px]">
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
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="z-10 shrink-0 border-b border-border">
            <Alert className="rounded-none border-0 py-2">
              <WarningCircleIcon className="size-4 text-chart-3" />
              <AlertTitle className="text-xs font-bold uppercase">
                {notice.title}
              </AlertTitle>
              <AlertDescription className="text-xs">
                {notice.message}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory Banner */}
      <AnimatePresence>
        {stats.hasWon && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-foreground bg-accent px-4 py-2.5 text-accent-foreground">
            <div className="flex items-center gap-3">
              <CheckCircleIcon className="size-5 shrink-0" weight="fill" />
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-heading text-base leading-none font-bold uppercase">
                  All 8 Suit Runs Completed!
                </span>
                <span className="text-xs opacity-85">
                  Final Score: {stats.score} · Completed in {stats.moves} moves (
                  {minutes}m {seconds}s).
                </span>
              </div>
            </div>
            <Button size="sm" onClick={() => startNewGame()} className="h-7 text-xs">
              Play Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-Width 10-Column Spider Tableau */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDrag(null)}>
        <div className="min-h-0 w-full flex-1 overflow-auto bg-card/30 p-2 sm:p-4">
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
              {activeMovingCards.map((card, idx) => (
                <div
                  key={card.id}
                  style={{
                    position: idx === 0 ? 'relative' : 'absolute',
                    top: idx === 0 ? 0 : idx * 26,
                    left: 0,
                    right: 0,
                    zIndex: idx + 1,
                  }}>
                  <SpiderPlayingCardView card={card} isMovable isOverlay />
                </div>
              ))}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
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
  onCardClick,
  onCardDoubleClick,
  onEmptyColumnClick,
}: {
  colIndex: number;
  cards: SpiderCard[];
  activeDrag: ActiveSelection | null;
  selectedRun: ActiveSelection | null;
  hint: SpiderMoveHint | null;
  isValidTarget: boolean;
  onCardClick: (colIndex: number, cardIndex: number) => void;
  onCardDoubleClick: (colIndex: number, cardIndex: number) => void;
  onEmptyColumnClick: (colIndex: number) => void;
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
  for (let i = 0; i < cards.length; i++) {
    cardTopOffsets.push(currentTop);
    currentTop += cards[i].faceUp ? faceUpStep : faceDownStep;
  }

  const columnHeight =
    cards.length === 0 ? 128 : cardTopOffsets[cards.length - 1] + 132;

  return (
    <div
      ref={setNodeRef}
      onClick={() => {
        if (cards.length === 0) {
          onEmptyColumnClick(colIndex);
        }
      }}
      style={{ minHeight: Math.max(420, columnHeight + 16) }}
      className={cn(
        'relative flex h-full flex-col border border-transparent p-0.5 transition-colors',
        isOver && isValidTarget && 'border-foreground bg-accent/35',
        !isOver &&
          isValidTarget &&
          'border-dashed border-foreground/40 bg-accent/15',
        isHintTarget && 'border-2 border-chart-3 bg-accent/25',
      )}>
      {/* Empty Column Slot */}
      {cards.length === 0 && (
        <div
          className={cn(
            'grid h-22 w-full place-items-center border border-dashed font-mono text-[10px] tracking-widest uppercase transition-colors sm:h-28 lg:h-32',
            isValidTarget || isHintTarget
              ? 'cursor-pointer border-foreground bg-accent/30 text-foreground'
              : 'border-border bg-secondary/20 text-muted-foreground/40',
          )}>
          Empty
        </div>
      )}

      {/* Cascading Cards */}
      {cards.map((card, cardIndex) => {
        const movable = isMovableRun(cards, cardIndex);
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
            isMovable={movable}
            isBeingDragged={isBeingDragged}
            isSelected={isSelected}
            isHintSource={isHintSource}
            onClick={() => onCardClick(colIndex, cardIndex)}
            onDoubleClick={() => onCardDoubleClick(colIndex, cardIndex)}
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
  card: SpiderCard;
  colIndex: number;
  cardIndex: number;
  topOffset: number;
  isMovable: boolean;
  isBeingDragged: boolean;
  isSelected: boolean;
  isHintSource: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
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
        position: 'absolute',
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
        'transition-transform duration-150',
        isMovable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
        isBeingDragged && 'pointer-events-none opacity-20',
      )}
      {...(isMovable ? listeners : {})}
      {...(isMovable ? attributes : {})}>
      <SpiderPlayingCardView
        card={card}
        isMovable={isMovable}
        isSelected={isSelected}
        isHintSource={isHintSource}
      />
    </div>
  );
};
