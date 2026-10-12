'use client';

import NumberFlow from '@number-flow/react';
import {
  ArrowCounterClockwiseIcon,
  BombIcon,
  CheckCircleIcon,
  CursorClickIcon,
  FlagBannerIcon,
  TimerIcon,
  WarningOctagonIcon,
  XIcon,
} from '@phosphor-icons/react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  FullscreenToggleButton,
  useGameFullscreen,
} from '@/features/common/use-game-fullscreen';
import { cn } from '@/lib/utils';
import { Cell } from './minesweeper-assets';
import {
  boardAtom,
  configAtom,
  DIFFICULTY_CONFIGS,
  difficultyAtom,
  elapsedSecondsAtom,
  inputModeAtom,
  minesweeperStatsAtom,
  resetBoardAtom,
  revealCellAtom,
  setDifficultyAtom,
  toggleFlagAtom,
  type Cell as BoardCell,
  type DifficultyId,
  type GameStatus,
} from './minesweeper-utils';

const STATUS_LABEL: Record<GameStatus, string> = {
  idle: 'Ready',
  playing: 'Active',
  won: 'Cleared',
  lost: 'Detonated',
};

const NUMBER_COLORS: Record<number, string> = {
  1: 'text-sky-700 dark:text-sky-400',
  2: 'text-emerald-700 dark:text-emerald-400',
  3: 'text-red-600 dark:text-red-400',
  4: 'text-indigo-700 dark:text-indigo-400',
  5: 'text-amber-800 dark:text-amber-400',
  6: 'text-teal-700 dark:text-teal-400',
  7: 'text-foreground',
  8: 'text-muted-foreground',
};

const DIFFICULTY_LIST = Object.values(DIFFICULTY_CONFIGS);

export default function Minesweeper() {
  const { containerRef, isFullscreen, toggleFullscreen } =
    useGameFullscreen<HTMLElement>();
  const arenaRef = React.useRef<HTMLDivElement | null>(null);
  const [ cellSize, setCellSize ] = React.useState<number>(36);

  const board = useAtomValue(boardAtom);
  const difficulty = useAtomValue(difficultyAtom);
  const config = useAtomValue(configAtom);
  const stats = useAtomValue(minesweeperStatsAtom);
  const [ inputMode, setInputMode ] = useAtom(inputModeAtom);
  const [ elapsedSeconds, setElapsedSeconds ] = useAtom(elapsedSecondsAtom);
  const setDifficulty = useSetAtom(setDifficultyAtom);
  const resetBoard = useSetAtom(resetBoardAtom);

  // Compute optimal cell size so the board fills the available arena height & width
  React.useEffect(() => {
    const element = arenaRef.current;
    if (!element) return;

    let rafId = 0;
    const updateCellSize = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        const gapTotalW = (config.cols - 1) * 2 + 36;
        const gapTotalH = (config.rows - 1) * 2 + 36;
        const maxW = Math.floor((rect.width - gapTotalW) / config.cols);
        const maxH = Math.floor((rect.height - gapTotalH) / config.rows);
        const nextCellSize = Math.max(24, Math.min(72, Math.min(maxW, maxH)));
        setCellSize(nextCellSize);
      });
    };

    updateCellSize();

    const observer = new ResizeObserver(updateCellSize);
    observer.observe(element);
    window.addEventListener('resize', updateCellSize);
    document.addEventListener('fullscreenchange', updateCellSize);

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', updateCellSize);
      document.removeEventListener('fullscreenchange', updateCellSize);
    };
  }, [ config.cols, config.rows ]);

  // Live timer while playing
  React.useEffect(() => {
    if (stats.status !== 'playing') {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => Math.min(999, prev + 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [ stats.status, setElapsedSeconds ]);

  // Keyboard shortcuts: F to toggle Dig/Flag mode, R to reset board
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }

      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setInputMode((prev) => (prev === 'dig' ? 'flag' : 'dig'));
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        resetBoard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ resetBoard, setInputMode ]);

  const isGameOver = stats.status === 'won' || stats.status === 'lost';

  return (
    <section
      ref={containerRef}
      className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background">
      {/* Unified Top Control & Telemetry HUD Bar */}
      <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-2 text-xs uppercase">
        {/* Left: Flags Left, Time, Status & Safe Cells */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <FlagBannerIcon
              className="size-4 shrink-0 text-chart-3"
              weight="fill"
            />
            <div className="flex flex-col">
              <span className="text-[10px] leading-none text-muted-foreground">
                Flags Left
              </span>
              <span className="font-mono text-sm font-bold text-foreground">
                <NumberFlow
                  value={stats.flagsRemaining}
                  format={{ minimumIntegerDigits: 2 }}
                />
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TimerIcon className="size-4 shrink-0 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-[10px] leading-none text-muted-foreground">
                Time
              </span>
              <span className="font-mono text-sm font-bold text-foreground">
                <NumberFlow
                  value={elapsedSeconds}
                  format={{ minimumIntegerDigits: 3 }}
                />
                s
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span
              className={cn(
                'text-[10px] font-bold tracking-widest uppercase',
                stats.hasWon
                  ? 'text-chart-2'
                  : stats.hasLost
                    ? 'text-destructive'
                    : 'text-muted-foreground',
              )}>
              {STATUS_LABEL[stats.status]}
            </span>
            <span className="font-mono text-xs font-bold text-foreground">
              Cleared {stats.revealedSafeCount}/{stats.totalSafeCells}
            </span>
          </div>
        </div>

        {/* Right: Difficulty Presets + Dig/Flag Mode + Reset + Fullscreen */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {DIFFICULTY_LIST.map((preset) => {
              const isActive = difficulty === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDifficulty(preset.id)}
                  className={cn(
                    'h-7 border px-2.5 text-[11px] font-medium tracking-wider uppercase transition-colors',
                    isActive
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}>
                  {preset.label}{' '}
                  <span className="hidden opacity-70 md:inline">
                    ({preset.rows}×{preset.cols})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex h-7 items-center border border-border bg-secondary/30 p-0.5">
              <button
                type="button"
                onClick={() => setInputMode('dig')}
                title="Dig Mode (Left click reveals cells) — Shortcut: F"
                className={cn(
                  'flex h-full items-center gap-1 px-2 text-[11px] font-medium tracking-wider uppercase transition-colors',
                  inputMode === 'dig'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
                )}>
                <CursorClickIcon className="size-3.5" />
                <span>Dig</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode('flag')}
                title="Flag Mode (Left click places flags) — Shortcut: F"
                className={cn(
                  'flex h-full items-center gap-1 px-2 text-[11px] font-medium tracking-wider uppercase transition-colors',
                  inputMode === 'flag'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}>
                <FlagBannerIcon className="size-3.5" weight="fill" />
                <span>Flag</span>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => resetBoard()}
              title="Reset board (Shortcut: R)"
              className="h-7 gap-1.5 px-2.5 text-[11px]">
              <ArrowCounterClockwiseIcon className="size-3.5" />
              <span>Reset</span>
            </Button>

            <FullscreenToggleButton
              isFullscreen={isFullscreen}
              onToggle={toggleFullscreen}
            />
          </div>
        </div>
      </div>

      {/* Win / Loss Outcome Banner */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2',
              stats.hasWon
                ? 'border-foreground bg-accent text-accent-foreground'
                : 'border-destructive bg-destructive/15 text-foreground',
            )}>
            <div className="flex items-center gap-2.5">
              {stats.hasWon ? (
                <CheckCircleIcon className="size-5 shrink-0" weight="fill" />
              ) : (
                <WarningOctagonIcon
                  className="size-5 shrink-0 text-destructive"
                  weight="fill"
                />
              )}
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-heading text-base leading-none font-bold tracking-tight uppercase">
                  {stats.hasWon ? 'Minefield Cleared!' : 'Mine Detonated!'}
                </span>
                <span className="text-[11px] opacity-80">
                  {stats.hasWon
                    ? `All ${config.mines} mines isolated in ${elapsedSeconds}s.`
                    : `Cleared ${stats.revealedSafeCount} of ${stats.totalSafeCells} safe sectors before detonation.`}
                </span>
              </div>
            </div>

            <Button
              size="sm"
              variant={stats.hasWon ? 'default' : 'destructive'}
              onClick={() => resetBoard()}
              className="h-7 px-3 text-[11px]">
              Play Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Responsive Minefield Arena */}
      <div
        ref={arenaRef}
        className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-auto bg-card/30 p-3">
        <div className="max-h-full max-w-full overflow-auto border border-border bg-secondary/40 p-1.5 shadow-xs">
          <div
            className="inline-flex flex-col gap-0.5"
            role="grid"
            aria-label={`Minesweeper ${difficulty} board`}>
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-0.5" role="row">
                {row.map((cell, colIndex) => (
                  <MinesweeperCell
                    key={`${rowIndex}-${colIndex}`}
                    row={rowIndex}
                    col={colIndex}
                    cell={cell}
                    difficulty={difficulty}
                    cellSize={cellSize}
                    inputMode={inputMode}
                    hasLost={stats.hasLost}
                    isLocked={isGameOver}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const MinesweeperCell = React.memo(function MinesweeperCell({
  row,
  col,
  cell,
  difficulty,
  cellSize,
  inputMode,
  hasLost,
  isLocked,
}: {
  row: number;
  col: number;
  cell: BoardCell;
  difficulty: DifficultyId;
  cellSize: number;
  inputMode: 'dig' | 'flag';
  hasLost: boolean;
  isLocked: boolean;
}) {
  const revealCell = useSetAtom(revealCellAtom);
  const flagCell = useSetAtom(toggleFlagAtom);

  const isWrongFlag = hasLost && cell.flagged && cell.value !== 'mine';
  const isChordable =
    !isLocked &&
    cell.revealed &&
    typeof cell.value === 'number' &&
    cell.value > 0;

  const handleClick = () => {
    if (isLocked) {
      return;
    }

    if (cell.revealed) {
      if (typeof cell.value === 'number' && cell.value > 0) {
        revealCell({ row, col });
      }
      return;
    }

    if (inputMode === 'flag') {
      flagCell({ row, col });
      return;
    }

    revealCell({ row, col });
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isLocked) {
      return;
    }
    if (cell.revealed) {
      if (typeof cell.value === 'number' && cell.value > 0) {
        revealCell({ row, col });
      }
      return;
    }
    flagCell({ row, col });
  };

  return (
    <Cell
      difficulty={difficulty}
      cellSize={cellSize}
      isRevealed={cell.revealed}
      isFlagged={cell.flagged}
      isExploded={Boolean(cell.exploded)}
      isWrongFlag={isWrongFlag}
      isChordable={isChordable}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      aria-label={`Row ${row + 1}, Column ${col + 1}${
        cell.flagged
          ? ', Flagged'
          : cell.revealed
            ? `, Revealed ${cell.value}`
            : ', Unrevealed'
      }`}>
      <CellContent
        cell={cell}
        isWrongFlag={isWrongFlag}
        cellSize={cellSize}
      />
    </Cell>
  );
});

const CellContent = ({
  cell,
  isWrongFlag,
  cellSize,
}: {
  cell: BoardCell;
  isWrongFlag: boolean;
  cellSize: number;
}) => {
  const iconPx = Math.max(13, Math.floor(cellSize * 0.45));
  const iconStyle = { width: iconPx, height: iconPx };

  if (isWrongFlag) {
    return (
      <span className="relative grid place-items-center">
        <FlagBannerIcon
          style={iconStyle}
          className="text-muted-foreground opacity-50"
          weight="fill"
        />
        <XIcon
          style={iconStyle}
          className="absolute text-destructive"
          weight="bold"
        />
      </span>
    );
  }

  if (cell.flagged && !cell.revealed) {
    return (
      <FlagBannerIcon
        style={iconStyle}
        className="text-chart-3"
        weight="fill"
      />
    );
  }

  if (!cell.revealed) {
    return null;
  }

  if (cell.value === 'mine') {
    return (
      <BombIcon
        style={iconStyle}
        className={
          cell.exploded ? 'text-destructive-foreground' : 'text-destructive'
        }
        weight="fill"
      />
    );
  }

  if (cell.value === 0) {
    return null;
  }

  return <span className={NUMBER_COLORS[cell.value]}>{cell.value}</span>;
};
