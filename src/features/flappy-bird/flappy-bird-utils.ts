export type GameStatus = 'idle' | 'playing' | 'gameover';

export type Pipe = {
  x: number;
  gapY: number;
  scored: boolean;
};

export type Bird = {
  y: number;
  velocity: number;
  rotation: number;
};

export type GameSize = {
  width: number;
  height: number;
};

export type GameMetrics = {
  width: number;
  height: number;
  scale: number;
  gravity: number;
  flapVelocity: number;
  maxFallSpeed: number;
  pipeWidth: number;
  pipeGap: number;
  pipeSpeed: number;
  birdX: number;
  birdWidth: number;
  birdHeight: number;
  groundHeight: number;
};

export const GAME_CONFIG = {
  baselineWidth: 400,
  baselineHeight: 600,
  gravity: 0.45,
  flapVelocity: -7.5,
  maxFallSpeed: 10,
  pipeWidth: 64,
  pipeGap: 150,
  pipeSpeed: 2.75,
  pipeSpawnInterval: 1800,
  birdXRatio: 80 / 400,
  birdWidth: 52,
  birdHeight: 40,
  birdHitboxWidthRatio: 0.72,
  birdHitboxHeightRatio: 0.72,
  groundHeight: 80,
  spriteFrames: 3,
  spriteFrameDuration: 120,
} as const;

export const getGameMetrics = (size: GameSize): GameMetrics => {
  const scale = size.height / GAME_CONFIG.baselineHeight;

  return {
    width: size.width,
    height: size.height,
    scale,
    gravity: GAME_CONFIG.gravity * scale,
    flapVelocity: GAME_CONFIG.flapVelocity * scale,
    maxFallSpeed: GAME_CONFIG.maxFallSpeed * scale,
    pipeWidth: GAME_CONFIG.pipeWidth * scale,
    pipeGap: GAME_CONFIG.pipeGap * scale,
    pipeSpeed: GAME_CONFIG.pipeSpeed * scale,
    birdX: size.width * GAME_CONFIG.birdXRatio,
    birdWidth: GAME_CONFIG.birdWidth * scale,
    birdHeight: GAME_CONFIG.birdHeight * scale,
    groundHeight: GAME_CONFIG.groundHeight * scale,
  };
};

export const createInitialBird = (metrics: GameMetrics): Bird => ({
  y: metrics.height / 2 - metrics.birdHeight / 2,
  velocity: 0,
  rotation: 0,
});

export const createPipe = (x: number, metrics: GameMetrics): Pipe => {
  const minGapY = 100 * metrics.scale;
  const maxGapY = metrics.height - metrics.groundHeight - metrics.pipeGap - 80 * metrics.scale;

  return {
    x,
    gapY: minGapY + Math.random() * Math.max(0, maxGapY - minGapY),
    scored: false,
  };
};

export const getBirdBounds = (bird: Bird, metrics: GameMetrics) => {
  const width = metrics.birdWidth * GAME_CONFIG.birdHitboxWidthRatio;
  const height = metrics.birdHeight * GAME_CONFIG.birdHitboxHeightRatio;

  return {
    x: metrics.birdX + (metrics.birdWidth - width) / 2,
    y: bird.y + (metrics.birdHeight - height) / 2,
    width,
    height,
  };
};

export const checkCollision = (bird: Bird, pipes: Pipe[], metrics: GameMetrics): boolean => {
  const bounds = getBirdBounds(bird, metrics);

  if (bounds.y <= 0 || bounds.y + bounds.height >= metrics.height - metrics.groundHeight) {
    return true;
  }

  return pipes.some((pipe) => {
    const inPipeColumn = bounds.x + bounds.width > pipe.x && bounds.x < pipe.x + metrics.pipeWidth;

    if (!inPipeColumn) {
      return false;
    }

    const aboveGap = bounds.y < pipe.gapY;
    const belowGap = bounds.y + bounds.height > pipe.gapY + metrics.pipeGap;

    return aboveGap || belowGap;
  });
};

export const clampBirdY = (bird: Bird, metrics: GameMetrics) => {
  const maxY = Math.max(0, metrics.height - metrics.groundHeight - metrics.birdHeight);
  bird.y = Math.min(Math.max(bird.y, 0), maxY);
};

export const updateScore = (
  pipes: Pipe[],
  birdX: number,
  pipeWidth: number,
): { pipes: Pipe[]; scoreDelta: number } => {
  let scoreDelta = 0;

  const updatedPipes = pipes.map((pipe) => {
    if (!pipe.scored && pipe.x + pipeWidth < birdX) {
      scoreDelta += 1;
      return { ...pipe, scored: true };
    }

    return pipe;
  });

  return { pipes: updatedPipes, scoreDelta };
};

export const getBestScore = (): number => {
  if (typeof window === 'undefined') {
    return 0;
  }

  const stored = window.localStorage.getItem('flappy-bird-best-score');
  return stored ? Number.parseInt(stored, 10) : 0;
};

export const setBestScore = (score: number) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem('flappy-bird-best-score', score.toString());
};
