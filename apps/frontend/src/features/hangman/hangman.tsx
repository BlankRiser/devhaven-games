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
        <div className="border-border bg-secondary/20 flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-6 border px-4 py-6 lg:flex-row lg:gap-12">
          <HangmanFigure />
          <HangmanInput />
        </div>

        <HangmanKeyboard />
      </div>
    </section>
  );
}
