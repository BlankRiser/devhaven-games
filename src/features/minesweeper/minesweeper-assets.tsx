import type * as React from 'react';
import { cn } from '@/lib/utils';
import type { DifficultyId } from './minesweeper-utils';

type CellProps = React.ComponentProps<'button'> & {
  isRevealed?: boolean;
  isFlagged?: boolean;
  isExploded?: boolean;
  isWrongFlag?: boolean;
  isChordable?: boolean;
  difficulty?: DifficultyId;
  cellSize?: number;
};

const DIFFICULTY_CELL_SIZE: Record<DifficultyId, string> = {
  beginner: 'size-9 sm:size-10 text-sm',
  intermediate: 'size-7 sm:size-8 text-xs',
  expert: 'size-6 sm:size-7 text-xs',
};

export const Cell = ({
  children,
  isRevealed = false,
  isFlagged = false,
  isExploded = false,
  isWrongFlag = false,
  isChordable = false,
  difficulty = 'beginner',
  cellSize,
  style,
  className,
  ...rest
}: CellProps) => {
  const dynamicStyle: React.CSSProperties | undefined = cellSize
    ? {
        width: cellSize,
        height: cellSize,
        fontSize: Math.max(11, Math.floor(cellSize * 0.42)),
        ...style,
      }
    : style;

  return (
    <button
      type="button"
      style={dynamicStyle}
      className={cn(
        'relative grid shrink-0 select-none place-items-center border border-border font-mono font-bold transition-colors focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none',
        !cellSize && DIFFICULTY_CELL_SIZE[difficulty],
        isExploded
          ? 'bg-destructive text-destructive-foreground'
          : isWrongFlag
            ? 'bg-destructive/15 text-destructive'
            : isRevealed
              ? isChordable
                ? 'cursor-pointer bg-background/85 hover:bg-secondary/50'
                : 'cursor-default bg-background/85'
              : isFlagged
                ? 'bg-secondary/90 hover:bg-secondary'
                : 'bg-secondary/65 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.18)] hover:bg-accent/50 active:bg-background/80 dark:shadow-[inset_1px_1px_0px_rgba(255,255,255,0.06)]',
        className,
      )}
      {...rest}>
      {children}
    </button>
  );
};
