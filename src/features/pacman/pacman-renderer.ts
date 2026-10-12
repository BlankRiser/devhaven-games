import type { Graphics } from 'pixi.js';
import {
  DIRECTION_ANGLES,
  DIRECTION_DELTAS,
} from '@/features/common/pixi/grid-math';
import {
  MAZE_COLS,
  MAZE_ROWS,
  PACMAN_MAZE_TEMPLATE,
  TILE_SIZE,
  type GhostActor,
  type PacmanWorldState,
} from './pacman-utils';

/**
 * Renders the static maze walls and ghost door once onto a dedicated PixiJS Graphics layer.
 */
export const drawStaticMaze = (g: Graphics): void => {
  g.clear();

  // Subtle background grid
  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      const tile = PACMAN_MAZE_TEMPLATE[r]?.[c];
      const x = c * TILE_SIZE;
      const y = r * TILE_SIZE;

      if (tile === 1) {
        g.roundRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4, 4);
        g.fill({ color: 0x1a_24_36 });
        g.stroke({ color: 0x3b_82_f6, width: 1.5, alpha: 0.85 });
      } else if (tile === 5) {
        // Ghost House Door
        g.rect(x + 1, y + TILE_SIZE / 2 - 2, TILE_SIZE - 2, 4);
        g.fill({ color: 0xff_b4_d6 });
      }
    }
  }
};

const drawGhost = (
  g: Graphics,
  ghost: GhostActor,
  frightenedTimer: number,
  pulseClock: number,
): void => {
  const cx = (ghost.col + 0.5) * TILE_SIZE;
  const cy = (ghost.row + 0.5) * TILE_SIZE;
  const radius = TILE_SIZE * 0.42;

  const isFrightened = ghost.mode === 'frightened';
  const isFlashing =
    isFrightened &&
    frightenedTimer < 2.0 &&
    Math.floor(frightenedTimer * 7) % 2 === 0;

  const bodyColor = isFrightened
    ? isFlashing
      ? 0xf5_f5_f7
      : 0x1d_4e_d8
    : ghost.color;

  // Draw body unless eaten (only eyes remain when eaten)
  if (ghost.mode !== 'eaten') {
    const topY = cy - radius * 0.15;
    const bottomY = cy + radius * 0.92;
    const leftX = cx - radius;
    const rightX = cx + radius;

    g.moveTo(leftX, bottomY);
    g.lineTo(leftX, topY);
    g.arc(cx, topY, radius, Math.PI, 0, false);
    g.lineTo(rightX, bottomY);

    // Wavy skirt at the bottom (3 waves)
    const waveCount = 3;
    const waveWidth = (radius * 2) / waveCount;
    const waveShift = Math.sin(pulseClock * 14) > 0 ? 1.5 : -1.5;

    for (let i = 0; i < waveCount; i++) {
      const segRight = rightX - i * waveWidth;
      const segMid = segRight - waveWidth * 0.5;
      const segLeft = segRight - waveWidth;
      g.lineTo(segMid, bottomY - 3.5 + (i % 2 === 0 ? waveShift : -waveShift));
      g.lineTo(segLeft, bottomY);
    }

    g.closePath();
    g.fill({ color: bodyColor });
  }

  // Draw eyes
  if (isFrightened) {
    const featureColor = isFlashing ? 0xdc_26_26 : 0xfef08a;
    g.circle(cx - 3.5, cy - 2, 1.8);
    g.circle(cx + 3.5, cy - 2, 1.8);
    g.fill({ color: featureColor });

    // Frightened wavy mouth
    g.moveTo(cx - 5, cy + 4);
    g.lineTo(cx - 2.5, cy + 2);
    g.lineTo(cx, cy + 4);
    g.lineTo(cx + 2.5, cy + 2);
    g.lineTo(cx + 5, cy + 4);
    g.stroke({ color: featureColor, width: 1.4 });
  } else {
    const lookDelta = DIRECTION_DELTAS[ghost.dir];
    const eyeOffsetX = lookDelta.col * 2;
    const eyeOffsetY = lookDelta.row * 2;

    // Sclera
    g.circle(cx - 3.8 + eyeOffsetX * 0.4, cy - 2.5 + eyeOffsetY * 0.4, 3.2);
    g.circle(cx + 3.8 + eyeOffsetX * 0.4, cy - 2.5 + eyeOffsetY * 0.4, 3.2);
    g.fill({ color: 0xff_ff_ff });

    // Pupils
    g.circle(cx - 3.8 + eyeOffsetX * 1.1, cy - 2.5 + eyeOffsetY * 1.1, 1.6);
    g.circle(cx + 3.8 + eyeOffsetX * 1.1, cy - 2.5 + eyeOffsetY * 1.1, 1.6);
    g.fill({ color: 0x1e_3a_8a });
  }
};

/**
 * Renders all dynamic elements (pellets, power pellets, fruit, Pac-Man, and 4 ghosts) on each frame.
 */
export const drawDynamicScene = (g: Graphics, world: PacmanWorldState): void => {
  g.clear();

  const powerRadius = 4.6 + Math.sin(world.pulseClock * 8) * 1.2;

  // 1. Draw remaining pellets and pulsing power pellets
  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      const tile = world.maze[r]?.[c];
      if (tile !== 2 && tile !== 3) continue;

      const cx = (c + 0.5) * TILE_SIZE;
      const cy = (r + 0.5) * TILE_SIZE;

      if (tile === 2) {
        g.circle(cx, cy, 2.4);
        g.fill({ color: 0xfd_e6_8a });
      } else {
        g.circle(cx, cy, powerRadius);
        g.fill({ color: 0xfb_bf_24 });
      }
    }
  }

  // 2. Draw bonus fruit if active
  if (world.fruit.active) {
    const fx = (world.fruit.col + 0.5) * TILE_SIZE;
    const fy = (world.fruit.row + 0.5) * TILE_SIZE;

    // Stem
    g.moveTo(fx - 2, fy + 1);
    g.lineTo(fx + 3, fy - 6);
    g.lineTo(fx + 4, fy + 2);
    g.stroke({ color: 0x4a_de_80, width: 1.8 });

    // Twin cherries
    g.circle(fx - 3, fy + 3, 3.5);
    g.circle(fx + 3, fy + 4, 3.5);
    g.fill({ color: 0xef_44_44 });
  }

  // 3. Draw Pac-Man with directional mouth wedge
  const pac = world.pacman;
  const px = (pac.col + 0.5) * TILE_SIZE;
  const py = (pac.row + 0.5) * TILE_SIZE;
  const pacRadius = TILE_SIZE * 0.43;
  const baseAngle = DIRECTION_ANGLES[pac.dir];
  const mouth = pac.mouthAngle * Math.PI;

  g.moveTo(px, py);
  g.arc(px, py, pacRadius, baseAngle + mouth, baseAngle + Math.PI * 2 - mouth, false);
  g.closePath();
  g.fill({ color: 0xfacc15 });

  // 4. Draw all 4 Ghosts
  for (const ghost of world.ghosts) {
    drawGhost(g, ghost, world.frightenedTimer, world.pulseClock);
  }
};
