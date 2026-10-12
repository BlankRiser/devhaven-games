'use client';

import NumberFlow from '@number-flow/react';
import {
  ArrowCounterClockwiseIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  GhostIcon,
  HeartIcon,
  LightningIcon,
  PauseIcon,
  PlayIcon,
  TrophyIcon,
} from '@phosphor-icons/react';
import { useTick } from '@pixi/react';
import { useAtom } from 'jotai';
import { AnimatePresence, motion } from 'motion/react';
import type { Graphics } from 'pixi.js';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  clampDeltaSeconds,
  type CardinalDirection,
} from '@/features/common/pixi/grid-math';
import { PixiStage } from '@/features/common/pixi/pixi-stage';
import { useArcadeDirection } from '@/features/common/pixi/use-keyboard-direction';
import { cn } from '@/lib/utils';
import { drawDynamicScene, drawStaticMaze } from './pacman-renderer';
import {
  createInitialWorld,
  pacmanHudAtom,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  stepPacmanWorld,
  type PacmanWorldState,
} from './pacman-utils';

interface PacmanPixiSceneProps {
  worldRef: React.RefObject<PacmanWorldState>;
  queuedDirectionRef: React.RefObject<{
    currentDirection: CardinalDirection;
    queuedDirection: CardinalDirection;
  }>;
  onSyncHud: () => void;
}

const PacmanPixiScene = ({
  worldRef,
  queuedDirectionRef,
  onSyncHud,
}: PacmanPixiSceneProps) => {
  const dynamicGraphicsRef = React.useRef<Graphics | null>(null);

  const renderStaticMaze = React.useCallback((g: Graphics) => {
    drawStaticMaze(g);
  }, []);

  const renderInitialDynamic = React.useCallback(
    (g: Graphics) => {
      dynamicGraphicsRef.current = g;
      drawDynamicScene(g, worldRef.current);
    },
    [ worldRef ],
  );

  const handleTick = React.useCallback(
    (ticker: { deltaMS: number }) => {
      const dt = clampDeltaSeconds(ticker.deltaMS);
      const world = worldRef.current;
      const queuedDir = queuedDirectionRef.current.queuedDirection;

      const hudChanged = stepPacmanWorld(world, queuedDir, dt);

      if (dynamicGraphicsRef.current) {
        drawDynamicScene(dynamicGraphicsRef.current, world);
      }

      if (hudChanged) {
        onSyncHud();
      }
    },
    [ onSyncHud, queuedDirectionRef, worldRef ],
  );

  useTick(handleTick);

  return (
    <pixiContainer>
      <pixiGraphics draw={renderStaticMaze} />
      <pixiGraphics draw={renderInitialDynamic} />
    </pixiContainer>
  );
};

export default function Pacman() {
  const [ hud, setHud ] = useAtom(pacmanHudAtom);
  const worldRef = React.useRef<PacmanWorldState>(createInitialWorld(0, 1));

  const syncHudFromWorld = React.useCallback(() => {
    const w = worldRef.current;
    setHud((prev) => ({
      ...prev,
      score: w.score,
      highScore: w.highScore,
      lives: w.lives,
      level: w.level,
      pelletsRemaining: w.pelletsRemaining,
      status: w.status,
      frightenedSeconds: Math.ceil(w.frightenedTimer),
    }));
  }, [ setHud ]);

  const handleFpsUpdate = React.useCallback(
    (measuredFps: number) => {
      setHud((prev) => (prev.fps === measuredFps ? prev : { ...prev, fps: measuredFps }));
    },
    [ setHud ],
  );

  const startOrResumeGame = React.useCallback(() => {
    const w = worldRef.current;
    if (w.status === 'gameover' || w.status === 'victory') {
      worldRef.current = createInitialWorld(w.highScore, 1);
      worldRef.current.status = 'playing';
    } else if (w.status === 'ready' || w.status === 'paused') {
      w.status = 'playing';
    }
    syncHudFromWorld();
  }, [ syncHudFromWorld ]);

  const togglePause = React.useCallback(() => {
    const w = worldRef.current;
    if (w.status === 'playing') {
      w.status = 'paused';
      syncHudFromWorld();
    } else if (w.status === 'paused' || w.status === 'ready') {
      w.status = 'playing';
      syncHudFromWorld();
    }
  }, [ syncHudFromWorld ]);

  const resetGame = React.useCallback(() => {
    const best = worldRef.current.highScore;
    worldRef.current = createInitialWorld(best, 1);
    syncHudFromWorld();
  }, [ syncHudFromWorld ]);

  const { inputRef, queueDirection, resetDirections, touchHandlers } =
    useArcadeDirection({
      onDirectionInput: () => {
        if (worldRef.current.status === 'ready') {
          worldRef.current.status = 'playing';
          syncHudFromWorld();
        }
      },
      onPauseToggle: togglePause,
      onReset: () => {
        resetDirections('left');
        resetGame();
      },
      onPrimaryAction: startOrResumeGame,
    });

  // Sync initial HUD state on mount
  React.useEffect(() => {
    resetDirections('left');
    syncHudFromWorld();
  }, [ resetDirections, syncHudFromWorld ]);

  return (
    <section
      className="flex h-full w-full flex-col overflow-auto border border-border bg-card/40"
      {...touchHandlers}>
      <div className="m-auto flex w-full max-w-2xl flex-col items-center gap-3 p-3 sm:p-5">
        {/* Top Controls & Telemetry Header */}
        <div className="flex w-full flex-wrap items-center justify-between gap-2 border border-border bg-card p-2">
          <div className="flex items-center gap-2">
            <span className="border border-border bg-secondary/50 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider uppercase">
              Level {hud.level}
            </span>
            <span
              title="Native display refresh rate via PixiJS WebGL Ticker"
              className="flex items-center gap-1 border border-border bg-accent/60 px-2 py-1 font-mono text-[11px] font-bold text-accent-foreground">
              <LightningIcon className="size-3.5" weight="fill" />
              {hud.fps} FPS
            </span>
            {hud.frightenedSeconds > 0 && (
              <span className="animate-pulse border border-sky-500/60 bg-sky-500/15 px-2 py-1 font-mono text-[11px] font-bold text-sky-600 uppercase dark:text-sky-400">
                Power // {hud.frightenedSeconds}s
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePause}
              disabled={hud.status === 'gameover'}
              title="Pause / Resume (Shortcut: P)"
              className="h-7 gap-1.5 px-2.5 text-[11px]">
              {hud.status === 'playing' ? (
                <>
                  <PauseIcon className="size-3.5" weight="fill" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <PlayIcon className="size-3.5" weight="fill" />
                  <span>{hud.status === 'ready' ? 'Start' : 'Resume'}</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetDirections('left');
                resetGame();
              }}
              title="Reset Game (Shortcut: R)"
              className="h-7 gap-1.5 px-2.5 text-[11px]">
              <ArrowCounterClockwiseIcon className="size-3.5" />
              <span>Reset</span>
            </Button>
          </div>
        </div>

        {/* Score, Lives & High Score Bar */}
        <div className="grid w-full grid-cols-3 items-center gap-2 border border-border bg-secondary/50 px-3 py-2 text-xs tracking-wider uppercase">
          <div className="flex flex-col">
            <span className="text-[10px] leading-none text-muted-foreground">Score</span>
            <span className="font-mono text-sm font-bold text-foreground">
              <NumberFlow value={hud.score} format={{ minimumIntegerDigits: 4 }} />
            </span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] leading-none text-muted-foreground">Lives</span>
            <div className="mt-1 flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, idx) => (
                <HeartIcon
                  key={idx}
                  weight="fill"
                  className={cn(
                    'size-4 transition-opacity',
                    idx < hud.lives ? 'text-amber-400' : 'text-muted-foreground/25',
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="flex items-center gap-1 text-[10px] leading-none text-muted-foreground">
              <TrophyIcon className="size-3 text-chart-3" weight="fill" />
              High Score
            </span>
            <span className="font-mono text-sm font-bold text-foreground">
              <NumberFlow value={hud.highScore} format={{ minimumIntegerDigits: 4 }} />
            </span>
          </div>
        </div>

        {/* PixiJS WebGL Stage + Status Overlay */}
        <div className="relative flex max-w-full items-center justify-center overflow-x-auto border border-border bg-[#0d111a] p-2">
          <PixiStage
            width={STAGE_WIDTH}
            height={STAGE_HEIGHT}
            backgroundColor={0x0d_11_1a}
            onFpsUpdate={handleFpsUpdate}>
            <PacmanPixiScene
              worldRef={worldRef}
              queuedDirectionRef={inputRef}
              onSyncHud={syncHudFromWorld}
            />
          </PixiStage>

          <AnimatePresence>
            {hud.status !== 'playing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-background/85 p-6 text-center backdrop-blur-[2px]">
                <div className="flex max-w-xs flex-col items-center gap-3 border border-border bg-card p-5 shadow-lg">
                  <div className="flex items-center gap-2">
                    <GhostIcon className="size-5 text-destructive" weight="fill" />
                    <span className="font-heading text-2xl font-bold tracking-tight uppercase">
                      {hud.status === 'gameover'
                        ? 'Game Over'
                        : hud.status === 'paused'
                          ? 'Game Paused'
                          : 'Pac-Man Ready'}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {hud.status === 'gameover'
                      ? `Final Score: ${hud.score} pts on Level ${hud.level}.`
                      : 'Use Arrow Keys or WASD to navigate the maze. Eat Power Pellets to turn the ghosts blue!'}
                  </p>

                  <Button onClick={startOrResumeGame} className="w-full gap-1.5">
                    <PlayIcon className="size-4" weight="fill" />
                    <span>
                      {hud.status === 'gameover'
                        ? 'Play Again'
                        : hud.status === 'paused'
                          ? 'Resume Game'
                          : 'Start Arcade'}
                    </span>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile / On-Screen D-Pad + Ghost AI Legend */}
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-[11px] tracking-wider text-muted-foreground uppercase">
            <span className="flex items-center gap-1">
              <span className="inline-block size-2.5 bg-[#ff3b30]" /> Blinky
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2.5 bg-[#ff77bc]" /> Pinky
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2.5 bg-[#00e5ff]" /> Inky
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2.5 bg-[#ff9f0a]" /> Clyde
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => queueDirection('left')}
              aria-label="Turn Left">
              <ArrowLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => queueDirection('up')}
              aria-label="Turn Up">
              <ArrowUpIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => queueDirection('down')}
              aria-label="Turn Down">
              <ArrowDownIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => queueDirection('right')}
              aria-label="Turn Right">
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
