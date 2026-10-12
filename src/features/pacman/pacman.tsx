'use client';

import NumberFlow from '@number-flow/react';
import {
  ArrowCounterClockwiseIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CornersInIcon,
  CornersOutIcon,
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
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const [ isFullscreen, setIsFullscreen ] = React.useState(false);

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

  const toggleFullscreen = React.useCallback(async () => {
    const element = sectionRef.current;
    if (!element) return;

    try {
      if (!document.fullscreenElement) {
        await element.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen permission errors
    }
  }, []);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
      ref={sectionRef}
      className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-[#0d111a]"
      {...touchHandlers}>
      {/* Unified Full-Width Top HUD Bar */}
      <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-2 text-xs uppercase">
        {/* Left: Score, High Score, Lives, Level */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] leading-none text-muted-foreground">Score</span>
            <span className="font-mono text-sm font-bold text-foreground">
              <NumberFlow value={hud.score} format={{ minimumIntegerDigits: 4 }} />
            </span>
          </div>

          <div className="flex flex-col">
            <span className="flex items-center gap-1 text-[10px] leading-none text-muted-foreground">
              <TrophyIcon className="size-3 text-chart-3" weight="fill" />
              Best
            </span>
            <span className="font-mono text-sm font-bold text-foreground">
              <NumberFlow value={hud.highScore} format={{ minimumIntegerDigits: 4 }} />
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] leading-none text-muted-foreground">Lives</span>
            <div className="mt-1 flex items-center gap-1">
              {Array.from({ length: 3 }).map((_, idx) => (
                <HeartIcon
                  key={idx}
                  weight="fill"
                  className={cn(
                    'size-3.5 transition-opacity',
                    idx < hud.lives ? 'text-amber-400' : 'text-muted-foreground/25',
                  )}
                />
              ))}
            </div>
          </div>

          <span className="border border-border bg-secondary/50 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider">
            Lvl {hud.level}
          </span>

          <span
            title="Native display refresh rate via PixiJS WebGL Ticker"
            className="flex items-center gap-1 border border-border bg-accent/60 px-2 py-1 font-mono text-[11px] font-bold text-accent-foreground">
            <LightningIcon className="size-3.5" weight="fill" />
            {hud.fps} FPS
          </span>

          {hud.frightenedSeconds > 0 && (
            <span className="animate-pulse border border-sky-500/60 bg-sky-500/15 px-2 py-1 font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400">
              Power // {hud.frightenedSeconds}s
            </span>
          )}
        </div>

        {/* Center/Right: Ghost Legend + D-Pad + Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden items-center gap-2.5 text-[10px] tracking-wider text-muted-foreground xl:flex">
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 bg-[#ff3b30]" /> Blinky
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 bg-[#ff77bc]" /> Pinky
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 bg-[#00e5ff]" /> Inky
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 bg-[#ff9f0a]" /> Clyde
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              className="size-7"
              onClick={() => queueDirection('left')}
              aria-label="Turn Left">
              <ArrowLeftIcon className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="size-7"
              onClick={() => queueDirection('up')}
              aria-label="Turn Up">
              <ArrowUpIcon className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="size-7"
              onClick={() => queueDirection('down')}
              aria-label="Turn Down">
              <ArrowDownIcon className="size-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="size-7"
              onClick={() => queueDirection('right')}
              aria-label="Turn Right">
              <ArrowRightIcon className="size-3.5" />
            </Button>
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

            <Button
              variant="outline"
              size="icon-sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="size-7">
              {isFullscreen ? (
                <CornersInIcon className="size-3.5" />
              ) : (
                <CornersOutIcon className="size-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Full-Screen PixiJS WebGL Stage + Status Overlay */}
      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden bg-[#0d111a]">
        <PixiStage
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          fitContainer
          padding={12}
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
              className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-6 text-center backdrop-blur-[2px]">
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
    </section>
  );
}
