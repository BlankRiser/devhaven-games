'use client';

import { GameHeader } from '../common/game-header';
import { FailedAttemptsCounter, HangmanInput, ResetHangman } from './hangman-assets';
import { HangmanFigure } from './hangman-figure';

export const Hangman = () => {
  return (
    <section className="border rounded-md border-zinc-200 dark:border-zinc-800 w-full h-full overflow-hidden">
      <GameHeader title="Hangman" />
      <div className="flex flex-col items-center gap-6 py-4">
        <FailedAttemptsCounter />
        <HangmanFigure />
        <HangmanInput />
        <ResetHangman />
      </div>
    </section>
  );
};
