import { atom } from "jotai";
import {
  DIRECTION_DELTAS,
  gridDistanceSquared,
  OPPOSITE_DIRECTION,
  wrapIndex,
} from "@/features/common/pixi/grid-math";
import type {
  CardinalDirection,
  GridCoord,
} from "@/features/common/pixi/grid-math";

export type TileValue = 0 | 1 | 2 | 3 | 4 | 5;
// 0 = Empty corridor, 1 = Wall, 2 = Pellet, 3 = Power Pellet, 4 = Ghost House, 5 = Ghost Door

export type GhostId = "blinky" | "pinky" | "inky" | "clyde";
export type GhostMode = "scatter" | "chase" | "frightened" | "eaten";
export type PacmanGameStatus =
  "ready" | "playing" | "paused" | "gameover" | "victory";

export const MAZE_COLS = 31;
export const MAZE_ROWS = 19;
export const TILE_SIZE = 28;
export const STAGE_WIDTH = MAZE_COLS * TILE_SIZE; // 868px widescreen
export const STAGE_HEIGHT = MAZE_ROWS * TILE_SIZE; // 532px widescreen

const GHOST_CENTER_COL = 15;
const GHOST_EXIT_ROW = 6;
const GHOST_HOUSE_ROW = 8;
const TUNNEL_ROW = 8;
const FRUIT_ROW = 10;
const PACMAN_START_ROW = 13;

// Symmetric 31x19 Widescreen Arcade Maze (center column = 15)
export const PACMAN_MAZE_TEMPLATE: readonly (readonly TileValue[])[] = [
  //0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30
  [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1,
  ], // R0
  [
    1, 3, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2,
    2, 2, 2, 2, 3, 1,
  ], // R1
  [
    1, 2, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2,
    1, 1, 1, 1, 2, 1,
  ], // R2
  [
    1, 2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2,
    1, 1, 1, 1, 2, 1,
  ], // R3
  [
    1, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2,
    2, 2, 2, 2, 2, 1,
  ], // R4
  [
    1, 1, 1, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    1, 1, 2, 1, 1, 1,
  ], // R5
  [
    1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 1, 2,
    1, 1, 2, 1, 1, 1,
  ], // R6 (Blinky spawns at 6,15)
  [
    1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 1, 1, 0, 1, 1, 5, 1, 1, 0, 1, 1, 2, 1, 1, 2,
    2, 2, 2, 2, 2, 1,
  ], // R7 (Ghost Door at 7,15)
  [
    0, 0, 0, 2, 1, 1, 2, 0, 0, 2, 0, 0, 0, 1, 4, 4, 4, 1, 0, 0, 0, 2, 0, 0, 2,
    1, 1, 2, 0, 0, 0,
  ], // R8 (Warp Tunnel + Ghost House)
  [
    1, 2, 2, 2, 2, 2, 2, 1, 1, 2, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 1, 2,
    2, 2, 2, 2, 2, 1,
  ], // R9
  [
    1, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 1, 2,
    1, 1, 2, 1, 1, 1,
  ], // R10 (Fruit spawns at 10,15)
  [
    1, 1, 1, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    1, 1, 2, 1, 1, 1,
  ], // R11
  [
    1, 2, 2, 2, 2, 2, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2,
    2, 2, 2, 2, 2, 1,
  ], // R12
  [
    1, 2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 0, 2, 2, 2, 1, 2, 2, 2, 2, 2,
    1, 1, 1, 1, 2, 1,
  ], // R13 (Pac-Man spawns at 13,15)
  [
    1, 2, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2,
    1, 1, 1, 1, 2, 1,
  ], // R14
  [
    1, 3, 2, 2, 1, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2,
    1, 1, 2, 2, 3, 1,
  ], // R15
  [
    1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2,
    1, 1, 2, 1, 1, 1,
  ], // R16
  [
    1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 1,
  ], // R17
  [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1,
  ], // R18
];

export const GHOST_COLORS: Record<GhostId, number> = {
  blinky: 0xff_3b_30, // Red
  pinky: 0xff_77_bc, // Pink
  inky: 0x00_e5_ff, // Cyan
  clyde: 0xff_9f_0a, // Orange
};

export const GHOST_SCATTER_TARGETS: Record<GhostId, GridCoord> = {
  blinky: { row: 0, col: MAZE_COLS - 2 },
  pinky: { row: 0, col: 1 },
  inky: { row: MAZE_ROWS - 1, col: MAZE_COLS - 2 },
  clyde: { row: MAZE_ROWS - 1, col: 1 },
};

export interface PacmanActor {
  row: number;
  col: number;
  dir: CardinalDirection;
  nextDir: CardinalDirection;
  mouthAngle: number;
  mouthOpening: boolean;
}

export interface GhostActor {
  id: GhostId;
  name: string;
  color: number;
  row: number;
  col: number;
  dir: CardinalDirection;
  mode: GhostMode;
  releaseDelay: number;
  inHouse: boolean;
  lastDecisionKey: string;
}

export interface FloatingScorePopup {
  id: number;
  x: number;
  y: number;
  text: string;
  ttl: number;
}

export interface BonusFruit {
  active: boolean;
  row: number;
  col: number;
  timer: number;
  points: number;
}

export interface PacmanWorldState {
  maze: TileValue[][];
  pelletsRemaining: number;
  pelletsEatenInLevel: number;
  score: number;
  highScore: number;
  lives: number;
  level: number;
  status: PacmanGameStatus;
  frightenedTimer: number;
  ghostCombo: number;
  waveTimer: number;
  currentWaveMode: "scatter" | "chase";
  respawnFreezeTimer: number;
  pacman: PacmanActor;
  ghosts: GhostActor[];
  fruit: BonusFruit;
  popups: FloatingScorePopup[];
  pulseClock: number;
}

export interface PacmanHudSnapshot {
  score: number;
  highScore: number;
  lives: number;
  level: number;
  pelletsRemaining: number;
  status: PacmanGameStatus;
  frightenedSeconds: number;
  fps: number;
}

export const cloneMazeTemplate = (): {
  maze: TileValue[][];
  totalPellets: number;
} => {
  let totalPellets = 0;
  const maze = PACMAN_MAZE_TEMPLATE.map((row) => {
    return row.map((tile) => {
      if (tile === 2 || tile === 3) {
        totalPellets += 1;
      }
      return tile;
    });
  });
  return { maze, totalPellets };
};

export const createInitialActors = (): {
  pacman: PacmanActor;
  ghosts: GhostActor[];
} => {
  return {
    pacman: {
      row: PACMAN_START_ROW,
      col: GHOST_CENTER_COL,
      dir: "left",
      nextDir: "left",
      mouthAngle: 0.2,
      mouthOpening: true,
    },
    ghosts: [
      {
        id: "blinky",
        name: "Blinky",
        color: GHOST_COLORS.blinky,
        row: GHOST_EXIT_ROW,
        col: GHOST_CENTER_COL,
        dir: "left",
        mode: "scatter",
        releaseDelay: 0,
        inHouse: false,
        lastDecisionKey: "",
      },
      {
        id: "pinky",
        name: "Pinky",
        color: GHOST_COLORS.pinky,
        row: GHOST_HOUSE_ROW,
        col: GHOST_CENTER_COL,
        dir: "up",
        mode: "scatter",
        releaseDelay: 1.5,
        inHouse: true,
        lastDecisionKey: "",
      },
      {
        id: "inky",
        name: "Inky",
        color: GHOST_COLORS.inky,
        row: GHOST_HOUSE_ROW,
        col: GHOST_CENTER_COL - 1,
        dir: "up",
        mode: "scatter",
        releaseDelay: 4,
        inHouse: true,
        lastDecisionKey: "",
      },
      {
        id: "clyde",
        name: "Clyde",
        color: GHOST_COLORS.clyde,
        row: GHOST_HOUSE_ROW,
        col: GHOST_CENTER_COL + 1,
        dir: "up",
        mode: "scatter",
        releaseDelay: 6.5,
        inHouse: true,
        lastDecisionKey: "",
      },
    ],
  };
};

export const createInitialWorld = (
  highScore = 0,
  level = 1
): PacmanWorldState => {
  const { maze, totalPellets } = cloneMazeTemplate();
  const { pacman, ghosts } = createInitialActors();

  return {
    maze,
    pelletsRemaining: totalPellets,
    pelletsEatenInLevel: 0,
    score: 0,
    highScore,
    lives: 3,
    level,
    status: "ready",
    frightenedTimer: 0,
    ghostCombo: 0,
    waveTimer: 0,
    currentWaveMode: "scatter",
    respawnFreezeTimer: 0,
    pacman,
    ghosts,
    fruit: {
      active: false,
      row: FRUIT_ROW,
      col: GHOST_CENTER_COL,
      timer: 0,
      points: level * 150,
    },
    popups: [],
    pulseClock: 0,
  };
};

export const canPacmanEnterTile = (
  maze: TileValue[][],
  row: number,
  col: number
): boolean => {
  const wrappedCol = wrapIndex(col, MAZE_COLS);
  const tile = maze[row]?.[wrappedCol];
  return tile === undefined ? false : tile !== 1 && tile !== 4 && tile !== 5;
};

export const canGhostEnterTile = (
  maze: TileValue[][],
  row: number,
  col: number,
  allowDoor: boolean
): boolean => {
  const wrappedCol = wrapIndex(col, MAZE_COLS);
  const tile = maze[row]?.[wrappedCol];
  if (tile === undefined || tile === 1) {
    return false;
  }
  if ((tile === 4 || tile === 5) && !allowDoor) {
    return false;
  }
  return true;
};

const computeGhostTarget = (
  ghost: GhostActor,
  pacman: PacmanActor,
  blinky: GhostActor
): GridCoord => {
  const pacTile = {
    row: Math.round(pacman.row),
    col: wrapIndex(Math.round(pacman.col), MAZE_COLS),
  };

  if (ghost.mode === "eaten") {
    return { row: GHOST_EXIT_ROW, col: GHOST_CENTER_COL };
  }

  if (ghost.mode === "scatter") {
    return GHOST_SCATTER_TARGETS[ghost.id];
  }

  const delta = DIRECTION_DELTAS[pacman.dir];

  switch (ghost.id) {
    case "blinky": {
      return pacTile;
    }
    case "pinky": {
      return {
        row: pacTile.row + delta.row * 4,
        col: pacTile.col + delta.col * 4,
      };
    }
    case "inky": {
      const aheadRow = pacTile.row + delta.row * 2;
      const aheadCol = pacTile.col + delta.col * 2;
      const bRow = Math.round(blinky.row);
      const bCol = Math.round(blinky.col);
      return {
        row: aheadRow + (aheadRow - bRow),
        col: aheadCol + (aheadCol - bCol),
      };
    }
    case "clyde": {
      const distributionSq = gridDistanceSquared(
        { row: Math.round(ghost.row), col: Math.round(ghost.col) },
        pacTile
      );
      return distributionSq > 36 ? pacTile : GHOST_SCATTER_TARGETS.clyde;
    }
  }
};

const CARDINAL_DIRS: CardinalDirection[] = ["up", "left", "down", "right"];

export const stepPacmanWorld = (
  world: PacmanWorldState,
  queuedDirection: CardinalDirection,
  dt: number
): boolean => {
  world.pulseClock += dt;

  // Update floating score popups
  if (world.popups.length > 0) {
    for (let index = world.popups.length - 1; index >= 0; index--) {
      world.popups[index].ttl -= dt;
      world.popups[index].y -= 18 * dt;
      if (world.popups[index].ttl <= 0) {
        world.popups.splice(index, 1);
      }
    }
  }

  if (world.status !== "playing") {
    return false;
  }

  if (world.respawnFreezeTimer > 0) {
    world.respawnFreezeTimer = Math.max(0, world.respawnFreezeTimer - dt);
    return false;
  }

  let isHudChanged = false;

  // Update bonus fruit timer
  if (world.fruit.active) {
    world.fruit.timer -= dt;
    if (world.fruit.timer <= 0) {
      world.fruit.active = false;
    }
  }

  // Update frightened timer & scatter/chase wave cycle
  if (world.frightenedTimer > 0) {
    const previousCeil = Math.ceil(world.frightenedTimer);
    world.frightenedTimer = Math.max(0, world.frightenedTimer - dt);
    if (Math.ceil(world.frightenedTimer) !== previousCeil) {
      isHudChanged = true;
    }
    if (world.frightenedTimer === 0) {
      world.ghostCombo = 0;
      for (const ghost of world.ghosts) {
        if (ghost.mode === "frightened") {
          ghost.mode = world.currentWaveMode;
        }
      }
      isHudChanged = true;
    }
  } else {
    world.waveTimer += dt;
    // Alternate 7s scatter / 20s chase
    const cyclePos = world.waveTimer % 27;
    const nextWaveMode: "scatter" | "chase" =
      cyclePos < 7 ? "scatter" : "chase";
    if (nextWaveMode !== world.currentWaveMode) {
      world.currentWaveMode = nextWaveMode;
      for (const ghost of world.ghosts) {
        if (!(ghost.mode === "scatter" || ghost.mode === "chase")) {
          continue;
        }

        ghost.mode = nextWaveMode;
        ghost.dir = OPPOSITE_DIRECTION[ghost.dir];
        ghost.lastDecisionKey = "";
      }
    }
  }

  // 1. Move Pac-Man (tiles per second)
  const pac = world.pacman;
  if (queuedDirection !== "none") {
    pac.nextDir = queuedDirection;
  }

  const pacmanSpeed = Math.min(9.5, 7.2 + (world.level - 1) * 0.35);

  // Allow instant reversal anywhere along a corridor
  if (pac.nextDir !== "none" && pac.nextDir === OPPOSITE_DIRECTION[pac.dir]) {
    pac.dir = pac.nextDir;
  }

  const nearestRow = Math.round(pac.row);
  const nearestCol = Math.round(pac.col);
  const distributionToCenter = Math.hypot(
    pac.row - nearestRow,
    pac.col - nearestCol
  );

  // Corner pre-turning when near tile center
  if (
    pac.nextDir !== "none" &&
    pac.nextDir !== pac.dir &&
    distributionToCenter < 0.24
  ) {
    const turnDelta = DIRECTION_DELTAS[pac.nextDir];
    if (
      canPacmanEnterTile(
        world.maze,
        nearestRow + turnDelta.row,
        nearestCol + turnDelta.col
      )
    ) {
      pac.row = nearestRow;
      pac.col = wrapIndex(nearestCol, MAZE_COLS);
      pac.dir = pac.nextDir;
    }
  }

  const moveDelta = DIRECTION_DELTAS[pac.dir];
  const nextTileRow = nearestRow + moveDelta.row;
  const nextTileCol = nearestCol + moveDelta.col;

  if (pac.dir !== "none") {
    const canMoveForward = canPacmanEnterTile(
      world.maze,
      nextTileRow,
      nextTileCol
    );
    const step = pacmanSpeed * dt;

    if (canMoveForward) {
      pac.row += moveDelta.row * step;
      pac.col += moveDelta.col * step;

      // Keep perpendicular axis aligned to corridor center
      if (moveDelta.row !== 0) {
        pac.col += (nearestCol - pac.col) * Math.min(1, 18 * dt);
      } else if (moveDelta.col !== 0) {
        pac.row += (nearestRow - pac.row) * Math.min(1, 18 * dt);
      }
    } else {
      // Clamp cleanly to current tile center when hitting a wall
      if (moveDelta.col > 0 && pac.col + step > nearestCol) {
        pac.col = nearestCol;
      } else if (moveDelta.col < 0 && pac.col - step < nearestCol) {
        pac.col = nearestCol;
      } else {
        pac.col += moveDelta.col * step;
      }

      if (moveDelta.row > 0 && pac.row + step > nearestRow) {
        pac.row = nearestRow;
      } else if (moveDelta.row < 0 && pac.row - step < nearestRow) {
        pac.row = nearestRow;
      } else {
        pac.row += moveDelta.row * step;
      }
    }

    // Wrap around horizontal tunnel
    if (pac.col < -0.45) {
      pac.col += MAZE_COLS;
    } else if (pac.col >= MAZE_COLS - 0.55) {
      pac.col -= MAZE_COLS;
    }

    // Animate mouth chomp smoothly when moving
    const isMoving =
      canMoveForward ||
      Math.hypot(pac.row - nearestRow, pac.col - nearestCol) > 0.02;
    if (isMoving) {
      const chompSpeed = 2.8;
      if (pac.mouthOpening) {
        pac.mouthAngle += chompSpeed * dt;
        if (pac.mouthAngle >= 0.38) {
          pac.mouthAngle = 0.38;
          pac.mouthOpening = false;
        }
      } else {
        pac.mouthAngle -= chompSpeed * dt;
        if (pac.mouthAngle <= 0.03) {
          pac.mouthAngle = 0.03;
          pac.mouthOpening = true;
        }
      }
    }
  }

  // 2. Check Pellet / Power Pellet / Bonus Fruit collection
  const currentTileRow = Math.round(pac.row);
  const currentTileCol = wrapIndex(Math.round(pac.col), MAZE_COLS);
  const tileUnderPacman = world.maze[currentTileRow]?.[currentTileCol];

  if (tileUnderPacman === 2 || tileUnderPacman === 3) {
    world.maze[currentTileRow][currentTileCol] = 0;
    world.pelletsRemaining -= 1;
    world.pelletsEatenInLevel += 1;

    const points = tileUnderPacman === 3 ? 50 : 10;
    world.score += points;
    if (world.score > world.highScore) {
      world.highScore = world.score;
    }

    // Spawn bonus fruit at 60 and 150 pellets eaten
    if (world.pelletsEatenInLevel === 60 || world.pelletsEatenInLevel === 150) {
      world.fruit = {
        active: true,
        row: FRUIT_ROW,
        col: GHOST_CENTER_COL,
        timer: 9.5,
        points: world.level * 150,
      };
    }

    // Trigger frightened mode on Power Pellet
    if (tileUnderPacman === 3) {
      const frightenedDuration = Math.max(3.5, 7.5 - (world.level - 1) * 0.6);
      world.frightenedTimer = frightenedDuration;
      world.ghostCombo = 0;

      for (const ghost of world.ghosts) {
        if (ghost.mode === "eaten") {
          continue;
        }

        ghost.mode = "frightened";
        if (ghost.inHouse) {
          continue;
        }

        ghost.dir = OPPOSITE_DIRECTION[ghost.dir];
        ghost.lastDecisionKey = "";
      }
    }

    if (world.pelletsRemaining <= 0) {
      // Level Cleared -> Advance to next level
      world.level += 1;
      const { maze, totalPellets } = cloneMazeTemplate();
      const { pacman: freshPac, ghosts: freshGhosts } = createInitialActors();
      world.maze = maze;
      world.pelletsRemaining = totalPellets;
      world.pelletsEatenInLevel = 0;
      world.frightenedTimer = 0;
      world.ghostCombo = 0;
      world.pacman = freshPac;
      world.ghosts = freshGhosts;
      world.respawnFreezeTimer = 1.1;
      world.popups.push({
        id: Math.random(),
        x: (GHOST_CENTER_COL + 0.5) * TILE_SIZE,
        y: FRUIT_ROW * TILE_SIZE,
        text: `LEVEL ${world.level}!`,
        ttl: 1.4,
      });
    }

    isHudChanged = true;
  }

  // Check bonus fruit pickup
  if (
    world.fruit.active &&
    Math.hypot(pac.row - world.fruit.row, pac.col - world.fruit.col) < 0.65
  ) {
    world.fruit.active = false;
    world.score += world.fruit.points;
    if (world.score > world.highScore) {
      world.highScore = world.score;
    }
    world.popups.push({
      id: Math.random(),
      x: (world.fruit.col + 0.5) * TILE_SIZE,
      y: world.fruit.row * TILE_SIZE,
      text: `+${world.fruit.points}`,
      ttl: 1.1,
    });
    isHudChanged = true;
  }

  // 3. Move Ghosts & Check Collisions
  const blinky = world.ghosts[0];
  const baseGhostSpeed = Math.min(8.6, 6.2 + (world.level - 1) * 0.35);

  for (const ghost of world.ghosts) {
    if (ghost.releaseDelay > 0) {
      ghost.releaseDelay = Math.max(0, ghost.releaseDelay - dt);
      continue;
    }

    // Exit Ghost House smoothly toward (GHOST_EXIT_ROW, GHOST_CENTER_COL)
    if (ghost.inHouse) {
      const exitSpeed = 4.5 * dt;
      if (Math.abs(ghost.col - GHOST_CENTER_COL) > 0.08) {
        ghost.col +=
          Math.sign(GHOST_CENTER_COL - ghost.col) *
          Math.min(Math.abs(GHOST_CENTER_COL - ghost.col), exitSpeed);
      } else {
        ghost.col = GHOST_CENTER_COL;
        ghost.row -= exitSpeed;
        if (ghost.row <= GHOST_EXIT_ROW) {
          ghost.row = GHOST_EXIT_ROW;
          ghost.inHouse = false;
          ghost.dir = Math.random() < 0.5 ? "left" : "right";
          ghost.lastDecisionKey = `${GHOST_EXIT_ROW},${GHOST_CENTER_COL}`;
        }
      }
      continue;
    }

    const isTunnelSlowdown =
      Math.round(ghost.row) === TUNNEL_ROW &&
      (ghost.col < 4 || ghost.col > MAZE_COLS - 5);
    const speed =
      ghost.mode === "eaten"
        ? 12.5
        : ghost.mode === "frightened"
          ? baseGhostSpeed * 0.58
          : isTunnelSlowdown
            ? baseGhostSpeed * 0.65
            : baseGhostSpeed;

    const gRow = Math.round(ghost.row);
    const gCol = Math.round(ghost.col);
    const distributionCenter = Math.hypot(ghost.row - gRow, ghost.col - gCol);
    const wrappedGCol = wrapIndex(gCol, MAZE_COLS);
    const tileKey = `${gRow},${wrappedGCol}`;

    // If eaten eyes reached above the ghost door, revive into active wave mode
    if (
      ghost.mode === "eaten" &&
      gRow === GHOST_EXIT_ROW &&
      wrappedGCol === GHOST_CENTER_COL &&
      distributionCenter < 0.25
    ) {
      ghost.row = GHOST_EXIT_ROW;
      ghost.col = GHOST_CENTER_COL;
      ghost.mode = world.currentWaveMode;
      ghost.dir = Math.random() < 0.5 ? "left" : "right";
      ghost.lastDecisionKey = tileKey;
    } else if (distributionCenter < 0.18 && ghost.lastDecisionKey !== tileKey) {
      ghost.row = gRow;
      ghost.col = wrappedGCol;
      ghost.lastDecisionKey = tileKey;

      const opposite = OPPOSITE_DIRECTION[ghost.dir];
      const validDirectories = CARDINAL_DIRS.filter((candidateDir) => {
        if (candidateDir === opposite) {
          return false;
        }
        const d = DIRECTION_DELTAS[candidateDir];
        return canGhostEnterTile(
          world.maze,
          gRow + d.row,
          wrappedGCol + d.col,
          ghost.mode === "eaten"
        );
      });

      if (validDirectories.length === 0) {
        // Dead end fallback: allow reversing
        const revDelta = DIRECTION_DELTAS[opposite];
        if (
          canGhostEnterTile(
            world.maze,
            gRow + revDelta.row,
            wrappedGCol + revDelta.col,
            ghost.mode === "eaten"
          )
        ) {
          ghost.dir = opposite;
        }
      } else if (ghost.mode === "frightened") {
        ghost.dir =
          validDirectories[Math.floor(Math.random() * validDirectories.length)];
      } else {
        const target = computeGhostTarget(ghost, pac, blinky);
        let bestDir = validDirectories[0];
        let minDistance = Infinity;

        for (const candidateDir of validDirectories) {
          const d = DIRECTION_DELTAS[candidateDir];
          const nextCoord = {
            row: gRow + d.row,
            col: wrapIndex(wrappedGCol + d.col, MAZE_COLS),
          };
          const distribution = gridDistanceSquared(nextCoord, target);
          if (!(distribution < minDistance)) {
            continue;
          }

          minDistance = distribution;
          bestDir = candidateDir;
        }
        ghost.dir = bestDir;
      }
    }

    const gDelta = DIRECTION_DELTAS[ghost.dir];
    ghost.row += gDelta.row * speed * dt;
    ghost.col += gDelta.col * speed * dt;

    if (ghost.col < -0.45) {
      ghost.col += MAZE_COLS;
    } else if (ghost.col >= MAZE_COLS - 0.55) {
      ghost.col -= MAZE_COLS;
    }
  }

  // 4. Actor Collisions (Pac-Man vs Ghosts)
  for (const ghost of world.ghosts) {
    if (ghost.inHouse) {
      continue;
    }
    const distribution = Math.hypot(pac.row - ghost.row, pac.col - ghost.col);
    if (distribution < 0.62) {
      if (ghost.mode === "frightened") {
        ghost.mode = "eaten";
        ghost.lastDecisionKey = "";
        world.ghostCombo += 1;
        const comboScore = 200 * 2 ** Math.min(3, world.ghostCombo - 1);
        world.score += comboScore;
        if (world.score > world.highScore) {
          world.highScore = world.score;
        }
        world.popups.push({
          id: Math.random(),
          x: (ghost.col + 0.5) * TILE_SIZE,
          y: ghost.row * TILE_SIZE,
          text: `${comboScore}`,
          ttl: 1,
        });
        isHudChanged = true;
      } else if (ghost.mode !== "eaten") {
        // Pac-Man loses a life
        world.lives -= 1;
        world.frightenedTimer = 0;
        world.ghostCombo = 0;
        isHudChanged = true;

        if (world.lives <= 0) {
          world.status = "gameover";
        } else {
          const { pacman: resetPac, ghosts: resetGhosts } =
            createInitialActors();
          world.pacman = resetPac;
          world.ghosts = resetGhosts;
          world.respawnFreezeTimer = 1;
        }
        break;
      }
    }
  }

  return isHudChanged;
};

export const pacmanHudAtom = atom<PacmanHudSnapshot>({
  score: 0,
  highScore: 0,
  lives: 3,
  level: 1,
  pelletsRemaining: 280,
  status: "ready",
  frightenedSeconds: 0,
  fps: 120,
});
