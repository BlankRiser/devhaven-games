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

export const GAME_CONFIG = {
  width: 400,
  height: 600,
  gravity: 0.45,
  flapVelocity: -7.5,
  maxFallSpeed: 10,
  pipeWidth: 64,
  pipeGap: 150,
  pipeSpeed: 2.75,
  pipeSpawnInterval: 1800,
  birdX: 80,
  birdWidth: 52,
  birdHeight: 36,
  groundHeight: 80,
  spriteFrames: 3,
  spriteFrameDuration: 120,
} as const;

export const createInitialBird = (): Bird => ({
  y: GAME_CONFIG.height / 2 - GAME_CONFIG.birdHeight / 2,
  velocity: 0,
  rotation: 0,
});

export const createPipe = (x: number): Pipe => {
  const minGapY = 100;
  const maxGapY = GAME_CONFIG.height - GAME_CONFIG.groundHeight - GAME_CONFIG.pipeGap - 80;

  return {
    x,
    gapY: minGapY + Math.random() * (maxGapY - minGapY),
    scored: false,
  };
};

export const getBirdBounds = (bird: Bird) => ({
  x: GAME_CONFIG.birdX,
  y: bird.y,
  width: GAME_CONFIG.birdWidth,
  height: GAME_CONFIG.birdHeight,
});

export const checkCollision = (bird: Bird, pipes: Pipe[]): boolean => {
  const bounds = getBirdBounds(bird);

  if (bounds.y <= 0 || bounds.y + bounds.height >= GAME_CONFIG.height - GAME_CONFIG.groundHeight) {
    return true;
  }

  return pipes.some((pipe) => {
    const inPipeColumn = bounds.x + bounds.width > pipe.x && bounds.x < pipe.x + GAME_CONFIG.pipeWidth;

    if (!inPipeColumn) {
      return false;
    }

    const aboveGap = bounds.y < pipe.gapY;
    const belowGap = bounds.y + bounds.height > pipe.gapY + GAME_CONFIG.pipeGap;

    return aboveGap || belowGap;
  });
};

export const updateScore = (pipes: Pipe[], birdX: number): { pipes: Pipe[]; scoreDelta: number } => {
  let scoreDelta = 0;

  const updatedPipes = pipes.map((pipe) => {
    if (!pipe.scored && pipe.x + GAME_CONFIG.pipeWidth < birdX) {
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
