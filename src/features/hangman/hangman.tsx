'use client';

import { FailedAttemptsCounter, HangmanInput, ResetHangman } from './hangman-assets';
import { HangmanFigure } from './hangman-figure';

export const Hangman = () => {
  return (
    <section className="border rounded-md border-zinc-200 dark:border-zinc-800 w-full h-full overflow-hidden">
      <div className="p-6 border-b border-b-neutral-200 dark:border-b-neutral-800">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Hangman</h2>
      </div>
      <div className="flex flex-col items-center gap-6 py-4">
        <FailedAttemptsCounter />
        <HangmanFigure />
        <HangmanInput />
        <ResetHangman />
      </div>
    </section>
  );
};
