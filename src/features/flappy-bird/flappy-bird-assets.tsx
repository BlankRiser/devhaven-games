'use client';

import NumberFlow from '@number-flow/react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
  type Bird,
  type GameMetrics,
  type GameStatus,
  type Pipe,
} from './flappy-bird-utils';

const SPRITE_PATH = '/games/flappy-bird/bird-sprite-sheet.png';

const defaultMetrics = getGameMetrics({
  width: GAME_CONFIG.baselineWidth,
  height: GAME_CONFIG.baselineHeight,
});

const drawBackground = (ctx: CanvasRenderingContext2D, metrics: GameMetrics) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, metrics.height);
  gradient.addColorStop(0, '#7dd3fc');
  gradient.addColorStop(0.55, '#bae6fd');
  gradient.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, metrics.width, metrics.height);
};

const drawClouds = (ctx: CanvasRenderingContext2D, offset: number, metrics: GameMetrics) => {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';

  const widthScale = metrics.width / GAME_CONFIG.baselineWidth;
  const clouds = [
    { x: 40, y: 80, scale: 1 },
    { x: 180, y: 140, scale: 0.8 },
    { x: 280, y: 60, scale: 0.9 },
    { x: 120, y: 220, scale: 0.7 },
  ];

  clouds.forEach((cloud, index) => {
    const wrap = metrics.width + 120 * metrics.scale;
    const x = ((cloud.x * widthScale - offset * (0.15 + index * 0.03)) % wrap) - 60 * metrics.scale;
    const y = cloud.y * metrics.scale;
    const size = 18 * cloud.scale * metrics.scale;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.9, y - size * 0.2, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x + size * 1.8, y, size * 0.9, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawGround = (ctx: CanvasRenderingContext2D, offset: number, metrics: GameMetrics) => {
  const groundY = metrics.height - metrics.groundHeight;

  ctx.fillStyle = '#86efac';
  ctx.fillRect(0, groundY, metrics.width, metrics.groundHeight);

  ctx.fillStyle = '#4ade80';
  ctx.fillRect(0, groundY, metrics.width, 14 * metrics.scale);

  ctx.fillStyle = '#22c55e';
  const stripeWidth = 28 * metrics.scale;
  for (let x = -((offset * 2) % stripeWidth); x < metrics.width; x += stripeWidth) {
    ctx.fillRect(x, groundY + 14 * metrics.scale, stripeWidth / 2, 8 * metrics.scale);
  }
};

const drawPipe = (ctx: CanvasRenderingContext2D, pipe: Pipe, metrics: GameMetrics) => {
  const { x, gapY } = pipe;
  const { pipeWidth, pipeGap, height, groundHeight, scale } = metrics;

  const drawPipeSegment = (segmentY: number, segmentHeight: number) => {
    const gradient = ctx.createLinearGradient(x, segmentY, x + pipeWidth, segmentY);
    gradient.addColorStop(0, '#22c55e');
    gradient.addColorStop(0.5, '#16a34a');
    gradient.addColorStop(1, '#15803d');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, segmentY, pipeWidth, segmentHeight);

    ctx.fillStyle = '#14532d';
    ctx.fillRect(x, segmentY, 6 * scale, segmentHeight);
    ctx.fillRect(x + pipeWidth - 6 * scale, segmentY, 6 * scale, segmentHeight);

    ctx.fillStyle = '#4ade80';
    ctx.fillRect(x - 4 * scale, segmentY, pipeWidth + 8 * scale, 16 * scale);
  };

  drawPipeSegment(0, gapY);
  drawPipeSegment(gapY + pipeGap, height - groundHeight - gapY - pipeGap);
};

const drawBird = (
  ctx: CanvasRenderingContext2D,
  bird: Bird,
  sprite: HTMLImageElement,
  frame: number,
  metrics: GameMetrics,
) => {
  const { birdX, birdWidth, birdHeight } = metrics;
  const frameWidth = sprite.width / GAME_CONFIG.spriteFrames;
  const frameHeight = sprite.height;

  ctx.save();
  ctx.translate(birdX + birdWidth / 2, bird.y + birdHeight / 2);
  ctx.rotate((bird.rotation * Math.PI) / 180);
  ctx.drawImage(
    sprite,
    frame * frameWidth,
    0,
    frameWidth,
    frameHeight,
    -birdWidth / 2,
    -birdHeight / 2,
    birdWidth,
    birdHeight,
  );
  ctx.restore();
};

export const FlappyBirdCanvas = () => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const spriteRef = React.useRef<HTMLImageElement | null>(null);
  const animationRef = React.useRef<number | null>(null);
  const lastFrameTimeRef = React.useRef<number>(0);
  const lastPipeSpawnRef = React.useRef<number>(0);
  const groundOffsetRef = React.useRef(0);
  const spriteFrameRef = React.useRef(0);
  const lastSpriteUpdateRef = React.useRef(0);
  const metricsRef = React.useRef<GameMetrics>(defaultMetrics);

  const gameStatusRef = React.useRef<GameStatus>('idle');
  const birdRef = React.useRef<Bird>(createInitialBird(defaultMetrics));
  const pipesRef = React.useRef<Pipe[]>([]);
  const scoreRef = React.useRef(0);

  const [ gameStatus, setGameStatus ] = React.useState<GameStatus>('idle');
  const [ score, setScore ] = React.useState(0);
  const [ bestScore, setBestScoreState ] = React.useState(0);

  const resetGame = React.useCallback(() => {
    birdRef.current = createInitialBird(metricsRef.current);
    pipesRef.current = [];
    groundOffsetRef.current = 0;
    spriteFrameRef.current = 0;
    lastPipeSpawnRef.current = 0;
    gameStatusRef.current = 'idle';
    setGameStatus('idle');
    scoreRef.current = 0;
    setScore(0);
  }, []);

  const startGame = React.useCallback(() => {
    const metrics = metricsRef.current;
    birdRef.current = createInitialBird(metrics);
    pipesRef.current = [ createPipe(metrics.width + 80 * metrics.scale, metrics) ];
    groundOffsetRef.current = 0;
    spriteFrameRef.current = 0;
    lastPipeSpawnRef.current = performance.now();
    gameStatusRef.current = 'playing';
    setGameStatus('playing');
    scoreRef.current = 0;
    setScore(0);
  }, []);

  const activateOverlayButton = React.useCallback(() => {
    if (gameStatusRef.current === 'gameover') {
      resetGame();
      return;
    }

    if (gameStatusRef.current === 'idle') {
      startGame();
    }
  }, [ resetGame, startGame ]);

  const flap = React.useCallback(() => {
    if (gameStatusRef.current === 'playing') {
      birdRef.current.velocity = metricsRef.current.flapVelocity;
    }
  }, []);

  const endGame = React.useCallback((finalScore: number) => {
    gameStatusRef.current = 'gameover';
    setGameStatus('gameover');

    const currentBest = getBestScore();
    if (finalScore > currentBest) {
      setBestScore(finalScore);
      setBestScoreState(finalScore);
    }
  }, []);

  const updateGame = React.useCallback((timestamp: number) => {
    if (gameStatusRef.current !== 'playing') {
      return;
    }

    const metrics = metricsRef.current;
    const bird = birdRef.current;
    bird.velocity = Math.min(bird.velocity + metrics.gravity, metrics.maxFallSpeed);
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.max(bird.velocity * 4 / metrics.scale, -25), 70);

    pipesRef.current = pipesRef.current
      .map((pipe) => ({ ...pipe, x: pipe.x - metrics.pipeSpeed }))
      .filter((pipe) => pipe.x + metrics.pipeWidth > -20 * metrics.scale);

    if (timestamp - lastPipeSpawnRef.current >= GAME_CONFIG.pipeSpawnInterval) {
      pipesRef.current.push(createPipe(metrics.width + 40 * metrics.scale, metrics));
      lastPipeSpawnRef.current = timestamp;
    }

    const scoreUpdate = updateScore(pipesRef.current, metrics.birdX, metrics.pipeWidth);
    pipesRef.current = scoreUpdate.pipes;

    if (scoreUpdate.scoreDelta > 0) {
      scoreRef.current += scoreUpdate.scoreDelta;
      setScore(scoreRef.current);
    }

    groundOffsetRef.current += metrics.pipeSpeed;

    if (timestamp - lastSpriteUpdateRef.current >= GAME_CONFIG.spriteFrameDuration) {
      spriteFrameRef.current = (spriteFrameRef.current + 1) % GAME_CONFIG.spriteFrames;
      lastSpriteUpdateRef.current = timestamp;
    }

    if (checkCollision(bird, pipesRef.current, metrics)) {
      endGame(scoreRef.current);
    }
  }, [ endGame ]);

  const renderFrame = React.useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const sprite = spriteRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (gameStatusRef.current === 'playing') {
      updateGame(timestamp);
    }

    const metrics = metricsRef.current;

    drawBackground(ctx, metrics);
    drawClouds(ctx, groundOffsetRef.current * 0.4, metrics);
    pipesRef.current.forEach((pipe) => drawPipe(ctx, pipe, metrics));
    drawGround(ctx, groundOffsetRef.current, metrics);

    if (sprite && sprite.complete) {
      drawBird(ctx, birdRef.current, sprite, spriteFrameRef.current, metrics);
    } else {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(
        metrics.birdX + metrics.birdWidth / 2,
        birdRef.current.y + metrics.birdHeight / 2,
        metrics.birdWidth / 2,
        metrics.birdHeight / 2,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }, [ updateGame ]);

  React.useEffect(() => {
    setBestScoreState(getBestScore());

    const sprite = new Image();
    sprite.src = SPRITE_PATH;
    sprite.onload = () => {
      spriteRef.current = sprite;
    };
  }, []);

  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;

    if (!wrapper || !canvas) {
      return;
    }

    const applySize = () => {
      const width = Math.max(1, wrapper.clientWidth);
      const height = Math.max(1, wrapper.clientHeight);
      const metrics = getGameMetrics({ width, height });
      metricsRef.current = metrics;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      clampBirdY(birdRef.current, metrics);
    };

    applySize();

    const resizeObserver = new ResizeObserver(applySize);
    resizeObserver.observe(wrapper);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  React.useEffect(() => {
    const loop = (timestamp: number) => {
      if (timestamp - lastFrameTimeRef.current >= 1000 / 60) {
        renderFrame(timestamp);
        lastFrameTimeRef.current = timestamp;
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [ renderFrame ]);

  React.useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' && event.code !== 'ArrowUp') {
        return;
      }

      event.preventDefault();

      if (event.repeat) {
        return;
      }

      if (gameStatusRef.current === 'playing') {
        flap();
        return;
      }

      activateOverlayButton();
    };

    document.addEventListener('keydown', handleKeyDown, { signal });

    return () => {
      abortController.abort();
    };
  }, [ activateOverlayButton, flap ]);

  return (
    <div ref={wrapperRef} className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        onClick={flap}
        onTouchStart={(event) => {
          event.preventDefault();
          flap();
        }}
        className={cn([
          'absolute inset-0 h-full w-full touch-none cursor-pointer',
          'bg-sky-200 dark:bg-sky-950',
        ])}
        aria-label="Flappy Bird game canvas. Click or press space to flap."
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-3 text-zinc-800">
        <div className="text-sm font-semibold drop-shadow-sm">
          Score: <NumberFlow value={score} />
        </div>
        <div className="text-sm font-semibold drop-shadow-sm">
          Best: <NumberFlow value={bestScore} />
        </div>
      </div>

      <AnimatePresence>
        {gameStatus !== 'playing' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="absolute inset-0 z-20 grid place-items-center bg-zinc-950/35 backdrop-blur-[1px]">
            <div className="rounded-lg border border-zinc-200/20 bg-zinc-950/80 px-6 py-5 text-center text-zinc-50 shadow-xl">
              <h3 className="text-2xl font-semibold tracking-tight">
                {gameStatus === 'idle' ? 'Flappy Bird' : 'Game Over'}
              </h3>
              <p className="mt-2 text-sm text-zinc-300">
                {gameStatus === 'idle'
                  ? 'Tap, click, or press Space to start.'
                  : `You scored ${score} point${score === 1 ? '' : 's'}.`}
              </p>
              {gameStatus === 'gameover' && (
                <p className="mt-1 text-xs text-zinc-400">
                  Best score: {Math.max(bestScore, score)}
                </p>
              )}
              <Button
                className="mt-4"
                onClick={(event) => {
                  event.stopPropagation();
                  activateOverlayButton();
                }}>
                {gameStatus === 'gameover' ? 'Play Again' : 'Start Game'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
