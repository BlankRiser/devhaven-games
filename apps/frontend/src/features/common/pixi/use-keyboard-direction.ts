"use client";

import * as React from "react";
import type { CardinalDirection } from "./grid-math";

export interface ArcadeInputBuffer {
  currentDirection: CardinalDirection;
  queuedDirection: CardinalDirection;
}

const KEY_TO_DIRECTION: Record<string, CardinalDirection> = {
  arrowup: "up",
  w: "up",
  arrowdown: "down",
  s: "down",
  arrowleft: "left",
  a: "left",
  arrowright: "right",
  d: "right",
};

export interface UseArcadeDirectionOptions {
  onDirectionInput?: (direction: CardinalDirection) => void;
  onPauseToggle?: () => void;
  onReset?: () => void;
  onPrimaryAction?: () => void;
}

export const useArcadeDirection = ({
  onDirectionInput,
  onPauseToggle,
  onReset,
  onPrimaryAction,
}: UseArcadeDirectionOptions = {}) => {
  const inputReference = React.useRef<ArcadeInputBuffer>({
    currentDirection: "none",
    queuedDirection: "none",
  });

  const touchStartReference = React.useRef<{ x: number; y: number } | null>(
    null
  );

  const queueDirection = React.useCallback(
    (direction: CardinalDirection) => {
      inputReference.current.queuedDirection = direction;
      onDirectionInput?.(direction);
    },
    [onDirectionInput]
  );

  const resetDirections = React.useCallback(
    (initial: CardinalDirection = "none") => {
      inputReference.current.currentDirection = initial;
      inputReference.current.queuedDirection = initial;
    },
    []
  );

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

      const key = event.key.toLowerCase();
      const mappedDirection = KEY_TO_DIRECTION[key];

      if (mappedDirection) {
        event.preventDefault();
        queueDirection(mappedDirection);
        return;
      }

      switch (key) {
        case "p": {
          event.preventDefault();
          onPauseToggle?.();

          break;
        }
        case "r": {
          event.preventDefault();
          onReset?.();

          break;
        }
        case " ":
        case "enter": {
          event.preventDefault();
          onPrimaryAction?.();

          break;
        }
        // No default
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onPauseToggle, onPrimaryAction, onReset, queueDirection]);

  const touchHandlers = React.useMemo(() => {
    return {
      onTouchStart: (event: React.TouchEvent<HTMLElement>) => {
        const touch = event.touches[0];
        if (!touch) {
          return;
        }
        touchStartReference.current = { x: touch.clientX, y: touch.clientY };
      },
      onTouchEnd: (event: React.TouchEvent<HTMLElement>) => {
        const start = touchStartReference.current;
        const touch = event.changedTouches[0];
        touchStartReference.current = null;
        if (!start || !touch) {
          return;
        }

        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        const minSwipeDistance = 20;

        if (
          Math.abs(dx) < minSwipeDistance &&
          Math.abs(dy) < minSwipeDistance
        ) {
          return;
        }

        if (Math.abs(dx) > Math.abs(dy)) {
          queueDirection(dx > 0 ? "right" : "left");
        } else {
          queueDirection(dy > 0 ? "down" : "up");
        }
      },
    };
  }, [queueDirection]);

  return {
    inputRef: inputReference,
    queueDirection,
    resetDirections,
    touchHandlers,
  };
};
