'use client';

import {
  FailedAttemptsCounter,
  HangmanErrorAlert,
  HangmanInput,
  HangmanKeyboard,
  HangmanOutcomeBanner,
  HangmanToolbar,
} from './hangman-assets';
import { HangmanFigure } from './hangman-figure';

export default function Hangman() {
  return (
    <section className="flex h-full w-full flex-col overflow-auto border border-border bg-card/40">
      <div className="m-auto flex w-full max-w-2xl flex-col items-center gap-3 p-3 sm:p-6">
        <HangmanToolbar />
        <FailedAttemptsCounter />
        <HangmanOutcomeBanner />

        <div className="flex w-full flex-col items-center gap-3 border border-border bg-secondary/25 px-4 py-4">
          <HangmanFigure />
          <HangmanInput />
        </div>

        <HangmanKeyboard />
        <HangmanErrorAlert />
      </div>
    </section>
  );
}
