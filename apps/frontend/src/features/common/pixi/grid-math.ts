export type CardinalDirection = "up" | "down" | "left" | "right" | "none";

export interface GridCoord {
  row: number;
  col: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export const DIRECTION_DELTAS: Record<CardinalDirection, GridCoord> = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
  none: { row: 0, col: 0 },
};

export const OPPOSITE_DIRECTION: Record<CardinalDirection, CardinalDirection> =
  {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
    none: "none",
  };

export const DIRECTION_ANGLES: Record<CardinalDirection, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
  none: 0,
};

/**
 * Clamps frame delta milliseconds into safe seconds so physics/movement stay smooth across 60fps, 120fps, 144fps, and background tab wakeups.
 */
export const clampDeltaSeconds = (
  deltaMS: number,
  maxDeltaSeconds = 0.05
): number =>
  !Number.isFinite(deltaMS) || deltaMS <= 0
    ? 1 / 120
    : Math.min(deltaMS / 1000, maxDeltaSeconds);

export const distanceSquared = (a: Vector2D, b: Vector2D): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};

export const gridDistanceSquared = (a: GridCoord, b: GridCoord): number => {
  const dRow = a.row - b.row;
  const dCol = a.col - b.col;
  return dRow * dRow + dCol * dCol;
};

export const wrapIndex = (value: number, max: number): number =>
  ((value % max) + max) % max;
