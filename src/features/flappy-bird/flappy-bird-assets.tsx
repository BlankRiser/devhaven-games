'use client';

import NumberFlow from '@number-flow/react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  checkCollision,
  createInitialBird,
  createPipe,
  GAME_CONFIG,
  getBestScore,
  setBestScore,
  updateScore,
  type Bird,
  type GameStatus,
  type Pipe,
} from './flappy-bird-utils';

const SPRITE_PATH = '/games/flappy-bird/bird-sprite-sheet.png';

const drawBackground = (ctx: CanvasRenderingContext2D) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.height);
  gradient.addColorStop(0, '#7dd3fc');
  gradient.addColorStop(0.55, '#bae6fd');
  gradient.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
};

const drawClouds = (ctx: CanvasRenderingContext2D, offset: number) => {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';

  const clouds = [
    { x: 40, y: 80, scale: 1 },
    { x: 180, y: 140, scale: 0.8 },
    { x: 280, y: 60, scale: 0.9 },
    { x: 120, y: 220, scale: 0.7 },
  ];

  clouds.forEach((cloud, index) => {
    const x = ((cloud.x - offset * (0.15 + index * 0.03)) % (GAME_CONFIG.width + 120)) - 60;
    const y = cloud.y;
    const size = 18 * cloud.scale;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.9, y - size * 0.2, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x + size * 1.8, y, size * 0.9, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawGround = (ctx: CanvasRenderingContext2D, offset: number) => {
  const groundY = GAME_CONFIG.height - GAME_CONFIG.groundHeight;

  ctx.fillStyle = '#86efac';
  ctx.fillRect(0, groundY, GAME_CONFIG.width, GAME_CONFIG.groundHeight);

  ctx.fillStyle = '#4ade80';
  ctx.fillRect(0, groundY, GAME_CONFIG.width, 14);

  ctx.fillStyle = '#22c55e';
  const stripeWidth = 28;
  for (let x = -((offset * 2) % stripeWidth); x < GAME_CONFIG.width; x += stripeWidth) {
    ctx.fillRect(x, groundY + 14, stripeWidth / 2, 8);
  }
};

const drawPipe = (ctx: CanvasRenderingContext2D, pipe: Pipe) => {
  const { x, gapY } = pipe;
  const { pipeWidth, pipeGap, height, groundHeight } = GAME_CONFIG;

  const drawPipeSegment = (segmentY: number, segmentHeight: number) => {
    const gradient = ctx.createLinearGradient(x, segmentY, x + pipeWidth, segmentY);
    gradient.addColorStop(0, '#22c55e');
    gradient.addColorStop(0.5, '#16a34a');
    gradient.addColorStop(1, '#15803d');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, segmentY, pipeWidth, segmentHeight);

    ctx.fillStyle = '#14532d';
    ctx.fillRect(x, segmentY, 6, segmentHeight);
    ctx.fillRect(x + pipeWidth - 6, segmentY, 6, segmentHeight);

    ctx.fillStyle = '#4ade80';
    ctx.fillRect(x - 4, segmentY, pipeWidth + 8, 16);
  };

  drawPipeSegment(0, gapY);
  drawPipeSegment(gapY + pipeGap, height - groundHeight - gapY - pipeGap);
};

const drawBird = (
  ctx: CanvasRenderingContext2D,
  bird: Bird,
  sprite: HTMLImageElement,
  frame: number,
) => {
  const { birdX, birdWidth, birdHeight } = GAME_CONFIG;
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
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const spriteRef = React.useRef<HTMLImageElement | null>(null);
  const animationRef = React.useRef<number | null>(null);
  const lastFrameTimeRef = React.useRef<number>(0);
  const lastPipeSpawnRef = React.useRef<number>(0);
  const groundOffsetRef = React.useRef(0);
  const spriteFrameRef = React.useRef(0);
  const lastSpriteUpdateRef = React.useRef(0);

  const gameStatusRef = React.useRef<GameStatus>('idle');
  const birdRef = React.useRef<Bird>(createInitialBird());
  const pipesRef = React.useRef<Pipe[]>([]);
  const scoreRef = React.useRef(0);

  const [ gameStatus, setGameStatus ] = React.useState<GameStatus>('idle');
  const [ score, setScore ] = React.useState(0);
  const [ bestScore, setBestScoreState ] = React.useState(0);
  const [ spriteLoaded, setSpriteLoaded ] = React.useState(false);

  const resetGame = React.useCallback(() => {
    birdRef.current = createInitialBird();
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
    birdRef.current = createInitialBird();
    pipesRef.current = [ createPipe(GAME_CONFIG.width + 80) ];
    groundOffsetRef.current = 0;
    spriteFrameRef.current = 0;
    lastPipeSpawnRef.current = performance.now();
    gameStatusRef.current = 'playing';
    setGameStatus('playing');
    scoreRef.current = 0;
    setScore(0);
  }, []);

  const flap = React.useCallback(() => {
    if (gameStatusRef.current === 'idle') {
      startGame();
      birdRef.current.velocity = GAME_CONFIG.flapVelocity;
      return;
    }

    if (gameStatusRef.current === 'playing') {
      birdRef.current.velocity = GAME_CONFIG.flapVelocity;
    }
  }, [ startGame ]);

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

    const bird = birdRef.current;
    bird.velocity = Math.min(bird.velocity + GAME_CONFIG.gravity, GAME_CONFIG.maxFallSpeed);
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.max(bird.velocity * 4, -25), 70);

    pipesRef.current = pipesRef.current
      .map((pipe) => ({ ...pipe, x: pipe.x - GAME_CONFIG.pipeSpeed }))
      .filter((pipe) => pipe.x + GAME_CONFIG.pipeWidth > -20);

    if (timestamp - lastPipeSpawnRef.current >= GAME_CONFIG.pipeSpawnInterval) {
      pipesRef.current.push(createPipe(GAME_CONFIG.width + 40));
      lastPipeSpawnRef.current = timestamp;
    }

    const scoreUpdate = updateScore(pipesRef.current, GAME_CONFIG.birdX);
    pipesRef.current = scoreUpdate.pipes;

    if (scoreUpdate.scoreDelta > 0) {
      scoreRef.current += scoreUpdate.scoreDelta;
      setScore(scoreRef.current);
    }

    groundOffsetRef.current += GAME_CONFIG.pipeSpeed;

    if (timestamp - lastSpriteUpdateRef.current >= GAME_CONFIG.spriteFrameDuration) {
      spriteFrameRef.current = (spriteFrameRef.current + 1) % GAME_CONFIG.spriteFrames;
      lastSpriteUpdateRef.current = timestamp;
    }

    if (checkCollision(bird, pipesRef.current)) {
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

    if (gameStatusRef.current === 'playing') {
      updateGame(timestamp);
    }

    drawBackground(ctx);
    drawClouds(ctx, groundOffsetRef.current * 0.4);
    pipesRef.current.forEach((pipe) => drawPipe(ctx, pipe));
    drawGround(ctx, groundOffsetRef.current);

    if (sprite && sprite.complete) {
      drawBird(ctx, birdRef.current, sprite, spriteFrameRef.current);
    } else {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(
        GAME_CONFIG.birdX + GAME_CONFIG.birdWidth / 2,
        birdRef.current.y + GAME_CONFIG.birdHeight / 2,
        GAME_CONFIG.birdWidth / 2,
        GAME_CONFIG.birdHeight / 2,
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
      setSpriteLoaded(true);
    };
    sprite.onerror = () => {
      setSpriteLoaded(false);
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
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault();
        flap();
      }
    };

    document.addEventListener('keydown', handleKeyDown, { signal });

    return () => {
      abortController.abort();
    };
  }, [ flap ]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[400px] px-1 text-zinc-700 dark:text-zinc-300">
        <div className="text-sm font-medium">
          Score: <NumberFlow value={score} />
        </div>
        <div className="text-sm font-medium">
          Best: <NumberFlow value={bestScore} />
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GAME_CONFIG.width}
          height={GAME_CONFIG.height}
          onClick={flap}
          onTouchStart={(event) => {
            event.preventDefault();
            flap();
          }}
          className={cn([
            'rounded-md border border-zinc-300 dark:border-zinc-700 shadow-lg touch-none cursor-pointer',
            'bg-sky-200 dark:bg-sky-950',
          ])}
          aria-label="Flappy Bird game canvas. Click or press space to flap."
        />

        <AnimatePresence>
          {gameStatus !== 'playing' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="absolute inset-0 grid place-items-center rounded-md bg-zinc-950/35 backdrop-blur-[1px]">
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
                    if (gameStatus === 'gameover') {
                      resetGame();
                    } else {
                      startGame();
                    }
                  }}>
                  {gameStatus === 'gameover' ? 'Play Again' : 'Start Game'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center max-w-[400px]">
        {spriteLoaded
          ? 'Animated bird sprite loaded. Click the canvas or press Space to flap.'
          : 'Loading bird sprite...'}
      </p>

      <Button variant="outline" onClick={resetGame}>
        Reset
      </Button>
    </div>
  );
};
