"use client";

import NumberFlow from "@number-flow/react";
import {
  ArrowCounterClockwiseIcon,
  PlayIcon,
  TrophyIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  FullscreenToggleButton,
  useGameFullscreen,
} from "@/features/common/use-game-fullscreen";
import { cn } from "@/lib/utils";
import {
  checkCollision,
  clampBirdY,
  createInitialBird,
  createPipe,
  GAME_CONFIG,
  getBestScore,
  getGameMetrics,
  setBestScore,
  updateScore,
} from "./flappy-bird-utils";
import type { Bird, GameMetrics, GameStatus, Pipe } from "./flappy-bird-utils";

const SPRITE_PATH = "/games/flappy-bird/bird-sprite-sheet.png";

const defaultMetrics = getGameMetrics({
  width: GAME_CONFIG.baselineWidth,
  height: GAME_CONFIG.baselineHeight,
});

const drawBackground = (
  context: CanvasRenderingContext2D,
  metrics: GameMetrics
) => {
  const gradient = context.createLinearGradient(0, 0, 0, metrics.height);
  gradient.addColorStop(0, "#7dd3fc");
  gradient.addColorStop(0.55, "#bae6fd");
  gradient.addColorStop(1, "#e0f2fe");
  context.fillStyle = gradient;
  context.fillRect(0, 0, metrics.width, metrics.height);
};

const drawClouds = (
  context: CanvasRenderingContext2D,
  offset: number,
  metrics: GameMetrics
) => {
  context.fillStyle = "rgba(255, 255, 255, 0.85)";

  const widthScale = metrics.width / GAME_CONFIG.baselineWidth;
  const clouds = [
    { x: 40, y: 80, scale: 1 },
    { x: 180, y: 140, scale: 0.8 },
    { x: 280, y: 60, scale: 0.9 },
    { x: 120, y: 220, scale: 0.7 },
  ];

  for (const [index, cloud] of clouds.entries()) {
    const wrap = metrics.width + 120 * metrics.scale;
    const x =
      ((cloud.x * widthScale - offset * (0.15 + index * 0.03)) % wrap) -
      60 * metrics.scale;
    const y = cloud.y * metrics.scale;
    const size = 18 * cloud.scale * metrics.scale;

    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.arc(x + size * 0.9, y - size * 0.2, size * 0.8, 0, Math.PI * 2);
    context.arc(x + size * 1.8, y, size * 0.9, 0, Math.PI * 2);
    context.fill();
  }
};

const drawGround = (
  context: CanvasRenderingContext2D,
  offset: number,
  metrics: GameMetrics
) => {
  const groundY = metrics.height - metrics.groundHeight;

  context.fillStyle = "#86efac";
  context.fillRect(0, groundY, metrics.width, metrics.groundHeight);

  context.fillStyle = "#4ade80";
  context.fillRect(0, groundY, metrics.width, 14 * metrics.scale);

  context.fillStyle = "#22c55e";
  const stripeWidth = 28 * metrics.scale;
  for (
    let x = -((offset * 2) % stripeWidth);
    x < metrics.width;
    x += stripeWidth
  ) {
    context.fillRect(
      x,
      groundY + 14 * metrics.scale,
      stripeWidth / 2,
      8 * metrics.scale
    );
  }
};

const drawPipe = (
  context: CanvasRenderingContext2D,
  pipe: Pipe,
  metrics: GameMetrics
) => {
  const { x, gapY } = pipe;
  const { pipeWidth, pipeGap, height, groundHeight, scale } = metrics;

  const drawPipeSegment = (segmentY: number, segmentHeight: number) => {
    const gradient = context.createLinearGradient(
      x,
      segmentY,
      x + pipeWidth,
      segmentY
    );
    gradient.addColorStop(0, "#22c55e");
    gradient.addColorStop(0.5, "#16a34a");
    gradient.addColorStop(1, "#15803d");

    context.fillStyle = gradient;
    context.fillRect(x, segmentY, pipeWidth, segmentHeight);

    context.fillStyle = "#14532d";
    context.fillRect(x, segmentY, 6 * scale, segmentHeight);
    context.fillRect(
      x + pipeWidth - 6 * scale,
      segmentY,
      6 * scale,
      segmentHeight
    );

    context.fillStyle = "#4ade80";
    context.fillRect(
      x - 4 * scale,
      segmentY,
      pipeWidth + 8 * scale,
      16 * scale
    );
  };

  drawPipeSegment(0, gapY);
  drawPipeSegment(gapY + pipeGap, height - groundHeight - gapY - pipeGap);
};

const drawBird = (
  context: CanvasRenderingContext2D,
  bird: Bird,
  sprite: HTMLImageElement,
  frame: number,
  metrics: GameMetrics
) => {
  const { birdX, birdWidth, birdHeight } = metrics;
  const frameWidth = sprite.width / GAME_CONFIG.spriteFrames;
  const frameHeight = sprite.height;

  context.save();
  context.translate(birdX + birdWidth / 2, bird.y + birdHeight / 2);
  context.rotate((bird.rotation * Math.PI) / 180);
  context.drawImage(
    sprite,
    frame * frameWidth,
    0,
    frameWidth,
    frameHeight,
    -birdWidth / 2,
    -birdHeight / 2,
    birdWidth,
    birdHeight
  );
  context.restore();
};

export const FlappyBirdCanvas = () => {
  const { containerRef, isFullscreen, toggleFullscreen } =
    useGameFullscreen<HTMLDivElement>();
  const wrapperReference = React.useRef<HTMLDivElement>(null);
  const canvasReference = React.useRef<HTMLCanvasElement>(null);
  const spriteReference = React.useRef<HTMLImageElement | null>(null);
  const animationReference = React.useRef<number | null>(null);
  const lastFrameTimeReference = React.useRef<number>(0);
  const lastPipeSpawnReference = React.useRef<number>(0);
  const groundOffsetReference = React.useRef(0);
  const spriteFrameReference = React.useRef(0);
  const lastSpriteUpdateReference = React.useRef(0);
  const metricsReference = React.useRef<GameMetrics>(defaultMetrics);

  const gameStatusRef = React.useRef<GameStatus>("idle");
  const birdRef = React.useRef<Bird>(createInitialBird(defaultMetrics));
  const pipesRef = React.useRef<Pipe[]>([]);
  const scoreRef = React.useRef(0);

  const [gameStatus, setGameStatus] = React.useState<GameStatus>("idle");
  const [score, setScore] = React.useState(0);
  const [bestScore, setBestScoreState] = React.useState(0);

  const resetGame = React.useCallback(() => {
    birdRef.current = createInitialBird(metricsReference.current);
    pipesRef.current = [];
    groundOffsetReference.current = 0;
    spriteFrameReference.current = 0;
    lastPipeSpawnReference.current = 0;
    gameStatusRef.current = "idle";
    setGameStatus("idle");
    scoreRef.current = 0;
    setScore(0);
  }, []);

  const startGame = React.useCallback(() => {
    const metrics = metricsReference.current;
    birdRef.current = createInitialBird(metrics);
    pipesRef.current = [
      createPipe(metrics.width + 80 * metrics.scale, metrics),
    ];
    groundOffsetReference.current = 0;
    spriteFrameReference.current = 0;
    lastPipeSpawnReference.current = performance.now();
    gameStatusRef.current = "playing";
    setGameStatus("playing");
    scoreRef.current = 0;
    setScore(0);
  }, []);

  const activateOverlayButton = React.useCallback(() => {
    if (gameStatusRef.current === "gameover") {
      startGame();
      return;
    }

    if (gameStatusRef.current === "idle") {
      startGame();
    }
  }, [startGame]);

  const flap = React.useCallback(() => {
    if (gameStatusRef.current === "playing") {
      birdRef.current.velocity = metricsReference.current.flapVelocity;
    }
  }, []);

  const endGame = React.useCallback((finalScore: number) => {
    gameStatusRef.current = "gameover";
    setGameStatus("gameover");

    const currentBest = getBestScore();
    if (finalScore > currentBest) {
      setBestScore(finalScore);
      setBestScoreState(finalScore);
    }
  }, []);

  const updateGame = React.useCallback(
    (timestamp: number) => {
      if (gameStatusRef.current !== "playing") {
        return;
      }

      const metrics = metricsReference.current;
      const bird = birdRef.current;
      bird.velocity = Math.min(
        bird.velocity + metrics.gravity,
        metrics.maxFallSpeed
      );
      bird.y += bird.velocity;
      bird.rotation = Math.min(
        Math.max((bird.velocity * 4) / metrics.scale, -25),
        70
      );

      pipesRef.current = pipesRef.current
        .map((pipe) => ({ ...pipe, x: pipe.x - metrics.pipeSpeed }))
        .filter((pipe) => pipe.x + metrics.pipeWidth > -20 * metrics.scale);

      if (
        timestamp - lastPipeSpawnReference.current >=
        GAME_CONFIG.pipeSpawnInterval
      ) {
        pipesRef.current.push(
          createPipe(metrics.width + 40 * metrics.scale, metrics)
        );
        lastPipeSpawnReference.current = timestamp;
      }

      const scoreUpdate = updateScore(
        pipesRef.current,
        metrics.birdX,
        metrics.pipeWidth
      );
      pipesRef.current = scoreUpdate.pipes;

      if (scoreUpdate.scoreDelta > 0) {
        scoreRef.current += scoreUpdate.scoreDelta;
        setScore(scoreRef.current);
      }

      groundOffsetReference.current += metrics.pipeSpeed;

      if (
        timestamp - lastSpriteUpdateReference.current >=
        GAME_CONFIG.spriteFrameDuration
      ) {
        spriteFrameReference.current =
          (spriteFrameReference.current + 1) % GAME_CONFIG.spriteFrames;
        lastSpriteUpdateReference.current = timestamp;
      }

      if (checkCollision(bird, pipesRef.current, metrics)) {
        endGame(scoreRef.current);
      }
    },
    [endGame]
  );

  const renderFrame = React.useCallback(
    (timestamp: number) => {
      const canvas = canvasReference.current;
      const sprite = spriteReference.current;

      if (!canvas) {
        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (gameStatusRef.current === "playing") {
        updateGame(timestamp);
      }

      const metrics = metricsReference.current;

      drawBackground(context, metrics);
      drawClouds(context, groundOffsetReference.current * 0.4, metrics);
      for (const pipe of pipesRef.current) {
        drawPipe(context, pipe, metrics);
      }
      drawGround(context, groundOffsetReference.current, metrics);

      if (sprite?.complete) {
        drawBird(
          context,
          birdRef.current,
          sprite,
          spriteFrameReference.current,
          metrics
        );
      } else {
        context.fillStyle = "#facc15";
        context.beginPath();
        context.ellipse(
          metrics.birdX + metrics.birdWidth / 2,
          birdRef.current.y + metrics.birdHeight / 2,
          metrics.birdWidth / 2,
          metrics.birdHeight / 2,
          0,
          0,
          Math.PI * 2
        );
        context.fill();
      }
    },
    [updateGame]
  );

  React.useEffect(() => {
    setBestScoreState(getBestScore());

    const sprite = new Image();
    sprite.src = SPRITE_PATH;
    sprite.addEventListener("load", () => {
      spriteReference.current = sprite;
    });
  }, []);

  React.useEffect(() => {
    const wrapper = wrapperReference.current;
    const canvas = canvasReference.current;

    if (!wrapper || !canvas) {
      return;
    }

    let rafId = 0;
    const applySize = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const rect = wrapper.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        const metrics = getGameMetrics({ width, height });
        metricsReference.current = metrics;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        const context = canvas.getContext("2d");
        if (context) {
          context.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        clampBirdY(birdRef.current, metrics);
      });
    };

    applySize();

    const resizeObserver = new ResizeObserver(applySize);
    resizeObserver.observe(wrapper);
    window.addEventListener("resize", applySize);
    document.addEventListener("fullscreenchange", applySize);

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", applySize);
      document.removeEventListener("fullscreenchange", applySize);
    };
  }, []);

  React.useEffect(() => {
    const loop = (timestamp: number) => {
      if (timestamp - lastFrameTimeReference.current >= 1000 / 60) {
        renderFrame(timestamp);
        lastFrameTimeReference.current = timestamp;
      }

      animationReference.current = requestAnimationFrame(loop);
    };

    animationReference.current = requestAnimationFrame(loop);

    return () => {
      if (animationReference.current) {
        cancelAnimationFrame(animationReference.current);
      }
    };
  }, [renderFrame]);

  React.useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyR" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        resetGame();
        return;
      }

      if (event.code !== "Space" && event.code !== "ArrowUp") {
        return;
      }

      event.preventDefault();

      if (event.repeat) {
        return;
      }

      if (gameStatusRef.current === "playing") {
        flap();
        return;
      }

      activateOverlayButton();
    };

    document.addEventListener("keydown", handleKeyDown, { signal });

    return () => {
      abortController.abort();
    };
  }, [activateOverlayButton, flap, resetGame]);

  return (
    <div
      ref={containerRef}
      className="bg-background relative flex h-full w-full flex-1 flex-col overflow-hidden"
    >
      {/* Unified Top Control & Telemetry HUD Bar */}
      <div className="border-border bg-card z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2 text-xs uppercase">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] leading-none">
              Score
            </span>
            <span className="text-foreground font-mono text-sm font-bold">
              <NumberFlow value={score} format={{ minimumIntegerDigits: 2 }} />
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-muted-foreground flex items-center gap-1 text-[10px] leading-none">
              <TrophyIcon className="text-chart-3 size-3" weight="fill" />
              Best
            </span>
            <span className="text-foreground font-mono text-sm font-bold">
              <NumberFlow
                value={Math.max(bestScore, score)}
                format={{ minimumIntegerDigits: 2 }}
              />
            </span>
          </div>

          <span
            className={cn(
              "border px-2.5 py-1 font-mono text-[11px] font-bold tracking-wider",
              gameStatus === "gameover"
                ? "border-destructive/60 bg-destructive/15 text-destructive"
                : gameStatus === "playing"
                  ? "border-foreground bg-accent text-accent-foreground"
                  : "border-border bg-secondary/50 text-foreground"
            )}
          >
            {gameStatus === "idle"
              ? "Ready"
              : gameStatus === "playing"
                ? "In Flight"
                : "Crashed"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {gameStatus === "playing" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={flap}
              className="h-7 gap-1.5 px-2.5 text-[11px]"
            >
              <span>Flap [Space]</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={activateOverlayButton}
              className="h-7 gap-1.5 px-2.5 text-[11px]"
            >
              <PlayIcon className="size-3.5" weight="fill" />
              <span>{gameStatus === "gameover" ? "Play Again" : "Start"}</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={resetGame}
            title="Reset Game (Shortcut: R)"
            className="h-7 gap-1.5 px-2.5 text-[11px]"
          >
            <ArrowCounterClockwiseIcon className="size-3.5" />
            <span>Reset</span>
          </Button>

          <FullscreenToggleButton
            isFullscreen={isFullscreen}
            onToggle={toggleFullscreen}
          />
        </div>
      </div>

      {/* Full-Screen Canvas Arena */}
      <div
        ref={wrapperReference}
        className="relative min-h-0 w-full flex-1 overflow-hidden"
      >
        <canvas
          ref={canvasReference}
          onClick={flap}
          onTouchStart={(event) => {
            event.preventDefault();
            flap();
          }}
          className={cn([
            "absolute inset-0 h-full w-full cursor-pointer touch-none",
            "bg-sky-200 dark:bg-sky-950",
          ])}
          aria-label="Flappy Bird game canvas. Click or press space to flap."
        />

        <AnimatePresence>
          {gameStatus !== "playing" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-background/60 absolute inset-0 z-20 grid place-items-center"
            >
              <div className="border-foreground/80 bg-card text-card-foreground border-2 px-8 py-6 text-center shadow-sm">
                <span className="text-muted-foreground text-[10px] font-light tracking-widest uppercase">
                  {gameStatus === "idle"
                    ? "MOD // 04 FLIGHT"
                    : "STATUS // TERMINATED"}
                </span>
                <h3 className="font-heading mt-1.5 text-4xl leading-none font-medium tracking-[-0.025em] uppercase">
                  {gameStatus === "idle" ? "Flappy Bird" : "Game Over"}
                </h3>
                <p className="text-muted-foreground mt-2 text-xs leading-4 font-light">
                  {gameStatus === "idle"
                    ? "Tap, click, or press Space to launch."
                    : `You scored ${score} point${score === 1 ? "" : "s"}.`}
                </p>
                {gameStatus === "gameover" && (
                  <p className="text-muted-foreground mt-1 text-xs leading-4 font-light uppercase">
                    Best score // {Math.max(bestScore, score)}
                  </p>
                )}
                <Button
                  className="mt-4 w-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    activateOverlayButton();
                  }}
                >
                  {gameStatus === "gameover" ? "Play Again" : "Start Game"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
