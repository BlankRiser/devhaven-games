import { cn } from "@/lib/utils";
import type * as React from "react";
import type { DifficultyId } from "./minesweeper-utils";

type CellProperties = React.ComponentProps<"button"> & {
  readonly isRevealed?: boolean;
  readonly isFlagged?: boolean;
  readonly isExploded?: boolean;
  readonly isWrongFlag?: boolean;
  readonly isChordable?: boolean;
  readonly difficulty?: DifficultyId;
  readonly cellSize?: number;
};

const DIFFICULTY_CELL_SIZE: Record<DifficultyId, string> = {
  beginner: "size-9 sm:size-10 text-sm",
  intermediate: "size-7 sm:size-8 text-xs",
  expert: "size-6 sm:size-7 text-xs",
};

export const Cell = ({
  children,
  isRevealed = false,
  isFlagged = false,
  isExploded = false,
  isWrongFlag = false,
  isChordable = false,
  difficulty = "beginner",
  cellSize,
  style,
  className,
  ...rest
}: CellProperties) => {
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
        "border-border focus-visible:ring-ring relative grid shrink-0 place-items-center border font-mono font-bold transition-colors select-none focus-visible:z-10 focus-visible:ring-1 focus-visible:outline-none",
        !cellSize && DIFFICULTY_CELL_SIZE[difficulty],
        isExploded
          ? "bg-destructive text-destructive-foreground"
          : isWrongFlag
            ? "bg-destructive/15 text-destructive"
            : isRevealed
              ? isChordable
                ? "bg-background/85 hover:bg-secondary/50 cursor-pointer"
                : "bg-background/85 cursor-default"
              : isFlagged
                ? "bg-secondary/90 hover:bg-secondary"
                : "bg-secondary/65 hover:bg-accent/50 active:bg-background/80 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.18)] dark:shadow-[inset_1px_1px_0px_rgba(255,255,255,0.06)]",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};
