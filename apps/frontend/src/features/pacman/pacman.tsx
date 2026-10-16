"use client";

import NumberFlow from "@number-flow/react";
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
} from "@phosphor-icons/react";
import { useAtomValue, useSetAtom } from "jotai";
import { AnimatePresence, motion } from "motion/react";
import { Container, Graphics } from "pixi.js";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { clampDeltaSeconds } from "@/features/common/pixi/grid-math";
import {
  PixiStage,
  usePixiApp,
  usePixiTick,
} from "@/features/common/pixi/pixi-stage";
import { useArcadeDirection } from "@/features/common/pixi/use-keyboard-direction";
import {
  FullscreenToggleButton,
  useGameFullscreen,
} from "@/features/common/use-game-fullscreen";
import { cn } from "@/lib/utils";
import { drawDynamicScene, drawStaticMaze } from "./pacman-renderer";
import {
  createInitialWorld,
  pacmanHudAtom,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  stepPacmanWorld,
} from "./pacman-utils";
import type { CardinalDirection } from "@/features/common/pixi/grid-math";
import type { PacmanWorldState } from "./pacman-utils";

interface PacmanPixiSceneProperties {
  readonly worldRef: React.RefObject<PacmanWorldState>;
  readonly queuedDirectionRef: React.RefObject<{
    currentDirection: CardinalDirection;
    queuedDirection: CardinalDirection;
  }>;
  readonly onSyncHud: () => void;
}

const PacmanPixiScene = React.memo(
  ({ worldRef, queuedDirectionRef, onSyncHud }: PacmanPixiSceneProperties) => {
    const { app, viewport } = usePixiApp();
    const dynamicGraphicsReference = React.useRef<Graphics | null>(null);

    React.useLayoutEffect(() => {
      if (viewport.destroyed) {
        return;
      }

      const sceneContainer = new Container();
      const staticMazeGraphics = new Graphics();
      const dynamicGraphics = new Graphics();

      drawStaticMaze(staticMazeGraphics);
      drawDynamicScene(dynamicGraphics, worldRef.current);

      sceneContainer.addChild(staticMazeGraphics);
      sceneContainer.addChild(dynamicGraphics);
      viewport.addChild(sceneContainer);
      dynamicGraphicsReference.current = dynamicGraphics;

      if (app.renderer) {
        app.render();
      }

      return () => {
        dynamicGraphicsReference.current = null;
        if (sceneContainer.destroyed) {
          return;
        }

        sceneContainer.removeFromParent();
        sceneContainer.destroy({ children: true });
      };
    }, [app, viewport, worldRef]);

    usePixiTick((ticker) => {
      const dt = clampDeltaSeconds(ticker.deltaMS);
      const world = worldRef.current;
      const queuedDir = queuedDirectionRef.current.queuedDirection;

      const isHudChanged = stepPacmanWorld(world, queuedDir, dt);

      const dynamicGraphics = dynamicGraphicsReference.current;
      if (dynamicGraphics && !dynamicGraphics.destroyed) {
        drawDynamicScene(dynamicGraphics, world);
      }

      if (isHudChanged) {
        onSyncHud();
      }
    });

    return null;
  }
);

const PacmanTopHud = ({
  isFullscreen,
  onQueueDirection,
  onTogglePause,
  onReset,
  onToggleFullscreen,
}: {
  readonly isFullscreen: boolean;
  readonly onQueueDirection: (dir: CardinalDirection) => void;
  readonly onTogglePause: () => void;
  readonly onReset: () => void;
  readonly onToggleFullscreen: () => void;
}) => {
  const hud = useAtomValue(pacmanHudAtom);

  return (
    <div className="border-border bg-card z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2 text-xs uppercase">
      {/* Left: Score, High Score, Lives, Level */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-[10px] leading-none">
            Score
          </span>
          <span className="text-foreground font-mono text-sm font-bold">
            <NumberFlow
              value={hud.score}
              format={{ minimumIntegerDigits: 4 }}
            />
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-muted-foreground flex items-center gap-1 text-[10px] leading-none">
            <TrophyIcon className="text-chart-3 size-3" weight="fill" />
            Best
          </span>
          <span className="text-foreground font-mono text-sm font-bold">
            <NumberFlow
              value={hud.highScore}
              format={{ minimumIntegerDigits: 4 }}
            />
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-muted-foreground text-[10px] leading-none">
            Lives
          </span>
          <div className="mt-1 flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, index) => {
              return (
                <HeartIcon
                  key={index}
                  weight="fill"
                  className={cn(
                    "size-3.5 transition-opacity",
                    index < hud.lives
                      ? "text-amber-400"
                      : "text-muted-foreground/25"
                  )}
                />
              );
            })}
          </div>
        </div>

        <span className="border-border bg-secondary/50 border px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider">
          Lvl {hud.level}
        </span>

        <span
          title="Native display refresh rate via PixiJS WebGL Ticker"
          className="border-border bg-accent/60 text-accent-foreground flex items-center gap-1 border px-2 py-1 font-mono text-[11px] font-bold"
        >
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
        <div className="text-muted-foreground hidden items-center gap-2.5 text-[10px] tracking-wider xl:flex">
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
            onClick={() => {
              onQueueDirection("left");
            }}
            aria-label="Turn Left"
          >
            <ArrowLeftIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="size-7"
            onClick={() => {
              onQueueDirection("up");
            }}
            aria-label="Turn Up"
          >
            <ArrowUpIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="size-7"
            onClick={() => {
              onQueueDirection("down");
            }}
            aria-label="Turn Down"
          >
            <ArrowDownIcon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="size-7"
            onClick={() => {
              onQueueDirection("right");
            }}
            aria-label="Turn Right"
          >
            <ArrowRightIcon className="size-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onTogglePause}
            disabled={hud.status === "gameover"}
            title="Pause / Resume (Shortcut: P)"
            className="h-7 gap-1.5 px-2.5 text-[11px]"
          >
            {hud.status === "playing" ? (
              <>
                <PauseIcon className="size-3.5" weight="fill" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <PlayIcon className="size-3.5" weight="fill" />
                <span>{hud.status === "ready" ? "Start" : "Resume"}</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            title="Reset Game (Shortcut: R)"
            className="h-7 gap-1.5 px-2.5 text-[11px]"
          >
            <ArrowCounterClockwiseIcon className="size-3.5" />
            <span>Reset</span>
          </Button>

          <FullscreenToggleButton
            isFullscreen={isFullscreen}
            onToggle={onToggleFullscreen}
          />
        </div>
      </div>
    </div>
  );
};

const PacmanStatusOverlay = ({
  onStartOrResume,
}: {
  readonly onStartOrResume: () => void;
}) => {
  const hud = useAtomValue(pacmanHudAtom);

  return (
    <AnimatePresence>
      {hud.status !== "playing" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="bg-background/75 absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center backdrop-blur-[2px]"
        >
          <div className="border-border bg-card flex max-w-xs flex-col items-center gap-3 border p-5 shadow-lg">
            <div className="flex items-center gap-2">
              <GhostIcon className="text-destructive size-5" weight="fill" />
              <span className="font-heading text-2xl font-bold tracking-tight uppercase">
                {hud.status === "gameover"
                  ? "Game Over"
                  : hud.status === "paused"
                    ? "Game Paused"
                    : "Pac-Man Ready"}
              </span>
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed">
              {hud.status === "gameover"
                ? `Final Score: ${hud.score} pts on Level ${hud.level}.`
                : "Use Arrow Keys or WASD to navigate the maze. Eat Power Pellets to turn the ghosts blue!"}
            </p>

            <Button onClick={onStartOrResume} className="w-full gap-1.5">
              <PlayIcon className="size-4" weight="fill" />
              <span>
                {hud.status === "gameover"
                  ? "Play Again"
                  : hud.status === "paused"
                    ? "Resume Game"
                    : "Start Arcade"}
              </span>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function Pacman() {
  const setHud = useSetAtom(pacmanHudAtom);
  const worldReference = React.useRef<PacmanWorldState>(
    createInitialWorld(0, 1)
  );
  const { containerRef, isFullscreen, toggleFullscreen } = useGameFullscreen();

  const syncHudFromWorld = React.useCallback(() => {
    const w = worldReference.current;
    setHud((previous) => ({
      ...previous,
      score: w.score,
      highScore: w.highScore,
      lives: w.lives,
      level: w.level,
      pelletsRemaining: w.pelletsRemaining,
      status: w.status,
      frightenedSeconds: Math.ceil(w.frightenedTimer),
    }));
  }, [setHud]);

  const handleFpsUpdate = React.useCallback(
    (measuredFps: number) => {
      setHud((previous) =>
        previous.fps === measuredFps
          ? previous
          : { ...previous, fps: measuredFps }
      );
    },
    [setHud]
  );

  const startOrResumeGame = React.useCallback(() => {
    const w = worldReference.current;
    if (w.status === "gameover" || w.status === "victory") {
      worldReference.current = createInitialWorld(w.highScore, 1);
      worldReference.current.status = "playing";
    } else if (w.status === "ready" || w.status === "paused") {
      w.status = "playing";
    }
    syncHudFromWorld();
  }, [syncHudFromWorld]);

  const togglePause = React.useCallback(() => {
    const w = worldReference.current;
    if (w.status === "playing") {
      w.status = "paused";
      syncHudFromWorld();
    } else if (w.status === "paused" || w.status === "ready") {
      w.status = "playing";
      syncHudFromWorld();
    }
  }, [syncHudFromWorld]);

  const resetGame = React.useCallback(() => {
    const best = worldReference.current.highScore;
    worldReference.current = createInitialWorld(best, 1);
    syncHudFromWorld();
  }, [syncHudFromWorld]);

  const { inputRef, queueDirection, resetDirections, touchHandlers } =
    useArcadeDirection({
      onDirectionInput: () => {
        if (worldReference.current.status !== "ready") {
          return;
        }

        worldReference.current.status = "playing";
        syncHudFromWorld();
      },
      onPauseToggle: togglePause,
      onReset: () => {
        resetDirections("left");
        resetGame();
      },
      onPrimaryAction: startOrResumeGame,
    });

  // Sync initial HUD state on mount
  React.useEffect(() => {
    resetDirections("left");
    syncHudFromWorld();
  }, [resetDirections, syncHudFromWorld]);

  const handleResetClick = React.useCallback(() => {
    resetDirections("left");
    resetGame();
  }, [resetDirections, resetGame]);

  return (
    <section
      ref={containerRef}
      className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-[#0d111a]"
      {...touchHandlers}
    >
      <PacmanTopHud
        isFullscreen={isFullscreen}
        onQueueDirection={queueDirection}
        onTogglePause={togglePause}
        onReset={handleResetClick}
        onToggleFullscreen={toggleFullscreen}
      />

      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden bg-[#0d111a]">
        <PixiStage
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          fitContainer
          padding={12}
          backgroundColor={0x0d_11_1a}
          onFpsUpdate={handleFpsUpdate}
        >
          <PacmanPixiScene
            worldRef={worldReference}
            queuedDirectionRef={inputRef}
            onSyncHud={syncHudFromWorld}
          />
        </PixiStage>

        <PacmanStatusOverlay onStartOrResume={startOrResumeGame} />
      </div>
    </section>
  );
}
