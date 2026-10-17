"use client";

import { useGameFullscreen } from "@/features/common/use-game-fullscreen";
import {
  HangmanErrorAlert,
  HangmanInput,
  HangmanKeyboard,
  HangmanOutcomeBanner,
  HangmanTopHud,
} from "./hangman-assets";
import { HangmanFigure } from "./hangman-figure";

export default function Hangman() {
  const { containerRef, isFullscreen, toggleFullscreen } = useGameFullscreen();

  return (
    <section
      ref={containerRef}
      className="bg-background relative flex h-full w-full flex-1 flex-col overflow-hidden"
    >
      <HangmanTopHud
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      <HangmanOutcomeBanner />
      <HangmanErrorAlert />

      <div className="bg-card/30 relative flex min-h-0 w-full flex-1 flex-col justify-between gap-4 overflow-auto p-3 sm:p-6">
        <div className="border-border bg-secondary/20 mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 border px-6 py-6 sm:gap-6 lg:flex-row lg:justify-center lg:gap-8">
          <HangmanFigure />
          <HangmanInput />
        </div>

        <HangmanKeyboard />
      </div>
    </section>
  );
}
