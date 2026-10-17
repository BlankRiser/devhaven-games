"use client";

import NumberFlow from "@number-flow/react";
import {
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  HeartBreakIcon,
  LightbulbIcon,
  WarningCircleIcon,
  WarningOctagonIcon,
} from "@phosphor-icons/react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { AnimatePresence, motion, useAnimation } from "motion/react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { FullscreenToggleButton } from "@/features/common/use-game-fullscreen";
import { cn } from "@/lib/utils";
import {
  guessLetterAtom,
  HANGMAN_DIFFICULTIES,
  hangmanDifficultyAtom,
  hangmanErrorAtom,
  hangmanStatsAtom,
  hintedLettersAtom,
  resetHangmanAtom,
  revealHintAtom,
  setHangmanDifficultyAtom,
} from "./hangman-utils";

const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
] as const;

const DIFFICULTY_LIST = Object.values(HANGMAN_DIFFICULTIES);

export const HangmanTopHud = ({
  isFullscreen,
  onToggleFullscreen,
}: {
  readonly isFullscreen: boolean;
  readonly onToggleFullscreen: () => void;
}) => {
  const difficulty = useAtomValue(hangmanDifficultyAtom);
  const stats = useAtomValue(hangmanStatsAtom);
  const setDifficulty = useSetAtom(setHangmanDifficultyAtom);
  const revealHint = useSetAtom(revealHintAtom);
  const resetHangman = useSetAtom(resetHangmanAtom);

  return (
    <div className="border-border bg-card z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2 text-xs uppercase">
      {/* Left: Telemetry (Attempts Left, Status, Misses) */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2">
          <HeartBreakIcon
            className={cn(
              "size-4 shrink-0",
              stats.maxAttemptsReached ? "text-destructive" : "text-chart-3"
            )}
            weight="fill"
          />
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] leading-none">
              Attempts Left
            </span>
            <span className="text-foreground font-mono text-sm font-bold">
              <NumberFlow value={stats.attemptsRemaining} /> /{" "}
              {stats.maxAttempts}
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <span
            className={cn(
              "text-[10px] font-bold tracking-widest uppercase",
              stats.hasWon
                ? "text-chart-2"
                : stats.maxAttemptsReached
                  ? "text-destructive"
                  : "text-muted-foreground"
            )}
          >
            {stats.hasWon
              ? "Word Decoded"
              : stats.maxAttemptsReached
                ? "Eliminated"
                : "In Progress"}
          </span>
          <span className="text-foreground font-mono text-xs font-bold">
            {stats.word.length} Letters · {stats.correctLetters.length} Found
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-muted-foreground text-[10px] leading-none">
            Misses
          </span>
          <span className="text-destructive mt-0.5 font-mono text-xs font-bold tracking-widest uppercase">
            {stats.wrongLetters.length > 0 ? stats.wrongLetters.join(" ") : "—"}
          </span>
        </div>
      </div>

      {/* Right: Difficulty Presets + Hint + New Word + Fullscreen */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {DIFFICULTY_LIST.map((preset) => {
            const isActive = difficulty === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setDifficulty(preset.id);
                }}
                className={cn(
                  "h-7 border px-2.5 text-[11px] font-medium tracking-wider uppercase transition-colors",
                  isActive
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={
              stats.hintsRemaining <= 0 ||
              stats.hasWon ||
              stats.maxAttemptsReached
            }
            onClick={() => {
              revealHint();
            }}
            title="Reveal a random letter"
            className="h-7 gap-1.5 px-2.5 text-[11px]"
          >
            <LightbulbIcon className="text-chart-3 size-3.5" weight="fill" />
            <span>Hint ({stats.hintsRemaining})</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetHangman();
            }}
            title="Get a new word"
            className="h-7 gap-1.5 px-2.5 text-[11px]"
          >
            <ArrowCounterClockwiseIcon className="size-3.5" />
            <span>New Word</span>
          </Button>

          <FullscreenToggleButton
            isFullscreen={isFullscreen}
            onToggle={onToggleFullscreen}
          />
        </div>
      </div>
    </div>
  );
};

export const HangmanOutcomeBanner = () => {
  const stats = useAtomValue(hangmanStatsAtom);
  const resetHangman = useSetAtom(resetHangmanAtom);
  const isGameOver = stats.hasWon || stats.maxAttemptsReached;

  return (
    <AnimatePresence>
      {isGameOver ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className={cn(
            "z-10 flex w-full shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-2",
            stats.hasWon
              ? "border-foreground bg-accent text-accent-foreground"
              : "border-destructive bg-destructive/15 text-foreground"
          )}
        >
          <div className="flex items-center gap-2.5">
            {stats.hasWon ? (
              <CheckCircleIcon className="size-5 shrink-0" weight="fill" />
            ) : (
              <WarningOctagonIcon
                className="text-destructive size-5 shrink-0"
                weight="fill"
              />
            )}
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-heading text-base leading-none font-bold tracking-tight uppercase">
                {stats.hasWon ? "Word Decoded!" : "Out of Attempts!"}
              </span>
              <span className="text-[11px] opacity-80">
                {stats.hasWon
                  ? `Solved "${stats.word.toUpperCase()}" with ${stats.attemptsRemaining} ${
                      stats.attemptsRemaining === 1 ? "attempt" : "attempts"
                    } remaining.`
                  : `The secret word was "${stats.word.toUpperCase()}".`}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            variant={stats.hasWon ? "default" : "destructive"}
            onClick={() => {
              resetHangman();
            }}
            className="h-7 px-3 text-[11px]"
          >
            Play Again
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export const HangmanInput = () => {
  const stats = useAtomValue(hangmanStatsAtom);
  const hintedLetters = useAtomValue(hintedLettersAtom);
  const guessLetter = useSetAtom(guessLetterAtom);
  const resetHangman = useSetAtom(resetHangmanAtom);
  const controls = useAnimation();
  const previousFailedReference = React.useRef(stats.failedAttempts);

  React.useEffect(() => {
    if (stats.failedAttempts > previousFailedReference.current) {
      void controls.start({
        x: [0, -7, 7, -5, 5, -2, 2, 0],
        transition: { duration: 0.32, ease: "easeInOut" },
      });
    }
    previousFailedReference.current = stats.failedAttempts;
  }, [stats.failedAttempts, controls]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      ) {
        return;
      }

      if ((stats.hasWon || stats.maxAttemptsReached) && e.key === "Enter") {
        e.preventDefault();
        resetHangman();
        return;
      }

      if (stats.hasWon || stats.maxAttemptsReached) {
        return;
      }

      if (e.key.length === 1) {
        guessLetter(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [guessLetter, resetHangman, stats.hasWon, stats.maxAttemptsReached]);

  return (
    <div className="flex w-auto max-w-full flex-col items-center justify-center py-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={stats.word || "empty"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="w-auto max-w-full"
        >
          <motion.div
            animate={controls}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
          >
            {stats.word.split("").map((letter, index) => {
              const isGuessed = stats.correctLetters.includes(letter);
              const isHinted = hintedLetters.includes(letter);
              const isMissedOnLoss = stats.maxAttemptsReached && !isGuessed;
              const isRevealed =
                isGuessed || stats.hasWon || stats.maxAttemptsReached;

              return (
                <motion.div
                  key={`${stats.word}-${index}`}
                  initial={{ opacity: 0, y: 8, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 340,
                    damping: 26,
                    delay: index * 0.025,
                  }}
                  className={cn(
                    "font-heading relative grid h-12 w-10 place-items-center overflow-hidden border border-b-2 text-xl font-bold uppercase transition-colors duration-200 select-none sm:h-14 sm:w-12 sm:text-2xl lg:h-16 lg:w-14 lg:text-3xl",
                    stats.hasWon
                      ? "border-foreground bg-accent text-accent-foreground"
                      : isMissedOnLoss
                        ? "border-destructive/60 border-b-destructive bg-destructive/15 text-destructive"
                        : isHinted
                          ? "border-chart-3/60 border-b-chart-3 bg-secondary/80 text-foreground"
                          : isGuessed
                            ? "border-border border-b-foreground bg-secondary/70 text-foreground"
                            : "border-border border-b-foreground/70 bg-card text-foreground"
                  )}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isRevealed ? (
                      <motion.span
                        key={`revealed-${letter}`}
                        initial={{ opacity: 0, y: 8, scale: 0.65 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.65 }}
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 24,
                        }}
                        className="inline-block leading-none"
                      >
                        {letter}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="placeholder"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 0.25, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.12 }}
                        className="bg-muted-foreground inline-block size-2"
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export const HangmanKeyboard = () => {
  const stats = useAtomValue(hangmanStatsAtom);
  const guessLetter = useSetAtom(guessLetterAtom);
  const isLocked = stats.hasWon || stats.maxAttemptsReached;

  return (
    <div className="mx-auto flex w-full max-w-4xl shrink-0 flex-col items-center gap-1.5 sm:gap-2">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex w-full justify-center gap-1.5 sm:gap-2"
        >
          {row.map((letter) => {
            const isCorrect = stats.correctLetters.includes(letter);
            const isWrong = stats.wrongLetters.includes(letter);
            const isTried = isCorrect || isWrong;

            return (
              <motion.button
                key={letter}
                type="button"
                whileTap={!isTried && !isLocked ? { scale: 0.92 } : undefined}
                disabled={isTried || isLocked}
                onClick={() => {
                  guessLetter(letter);
                }}
                aria-label={`Guess letter ${letter.toUpperCase()}`}
                className={cn(
                  "grid h-10 max-w-14 min-w-7 flex-1 place-items-center border font-mono text-xs font-bold uppercase transition-colors select-none sm:h-12 sm:text-sm",
                  isCorrect
                    ? "border-foreground bg-accent text-accent-foreground"
                    : isWrong
                      ? "border-destructive/30 bg-destructive/15 text-destructive/70 line-through opacity-60"
                      : "border-border bg-card text-foreground hover:bg-secondary active:bg-secondary/80 disabled:opacity-50"
                )}
              >
                {letter}
              </motion.button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const HangmanErrorAlert = () => {
  const [error, setError] = useAtom(hangmanErrorAtom);

  React.useEffect(() => {
    if (!error) {
      return;
    }

    const timer = setTimeout(() => {
      setError(null);
    }, 2400);
    return () => {
      clearTimeout(timer);
    };
  }, [error, setError]);

  return (
    <AnimatePresence mode="wait">
      {error ? (
        <motion.div
          key={`${error.title}-${error.message}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16 }}
          className="border-destructive bg-destructive/15 text-foreground z-10 flex w-full shrink-0 items-center gap-2.5 border-b px-4 py-2"
        >
          <WarningCircleIcon className="text-destructive size-4 shrink-0" />
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-heading text-destructive text-xs leading-none font-bold tracking-tight uppercase">
              {error.title}
            </span>
            <span className="text-xs opacity-85">{error.message}</span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
