'use client';

import { useGameFullscreen } from '@/features/common/use-game-fullscreen';
import {
  HangmanErrorAlert,
  HangmanInput,
  HangmanKeyboard,
  HangmanOutcomeBanner,
  HangmanTopHud,
} from './hangman-assets';
import { HangmanFigure } from './hangman-figure';

export default function Hangman() {
  const { containerRef, isFullscreen, toggleFullscreen } =
    useGameFullscreen<HTMLElement>();

  return (
    <section
      ref={containerRef}
      className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background">
      <HangmanTopHud
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      <HangmanOutcomeBanner />
      <HangmanErrorAlert />

      <div className="relative flex min-h-0 w-full flex-1 flex-col justify-between gap-4 overflow-auto bg-card/30 p-3 sm:p-6">
        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-6 border border-border bg-secondary/20 px-4 py-6 lg:flex-row lg:gap-12">
          <HangmanFigure />
          <HangmanInput />
        </div>

        <HangmanKeyboard />
      </div>
    </section>
  );
}
