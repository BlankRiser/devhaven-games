'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import NumberFlow from '@number-flow/react';
import { useAtom, useSetAtom } from 'jotai';
import { useResetAtom } from 'jotai/utils';
import { motion, useAnimation } from 'motion/react';
import * as React from 'react';
import { failedAttemptsAtom, hangmanStatsAtom, lettersAtom, uniqueWordAtom } from './hangman-utils';

const shakeContainer = {
  start: () => ({
    rotate: [0, 2, -2, 2, 0],
    transition: {
      repeat: 1,
      duration: 0.25,
    },
  }),
  reset: {
    rotate: 0,
  },
};

export const HangmanInput = () => {
  const [word] = useAtom(uniqueWordAtom);
  const [stats] = useAtom(hangmanStatsAtom);

  const setLetters = useSetAtom(lettersAtom);
  const setFailedAttempts = useSetAtom(failedAttemptsAtom);

  const controls = useAnimation();

  const checkLetterInWord = React.useCallback(
    ({ letter, word }: { letter: string; word: string }) => {
      if (word.includes(letter) && stats.correctLetters.includes(letter) === false) {
        return true;
      }

      return false;
    },
    [stats.correctLetters],
  );

  const handleKeyPress = React.useCallback(
    (e: KeyboardEvent) => {
      const keyInput = e.key;

      // Reset animation as soon as user types
      controls.stop();
      controls.set('reset');

      if (/^[a-zA-Z]$/.test(keyInput) && stats.maxAttemptsReached === false) {
        if (
          checkLetterInWord({
            letter: keyInput,
            word: word!,
          })
        ) {
          setLetters((values) => [...values, keyInput]);
        } else {
          controls.start('start');
          setFailedAttempts((failedAttempts) => failedAttempts + 1);
        }
      }
    },
    [stats.maxAttemptsReached, checkLetterInWord, word, setLetters, controls, setFailedAttempts],
  );

  React.useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    document.addEventListener('keydown', (e) => handleKeyPress(e), {
      signal,
    });

    return () => {
      abortController.abort();
    };
  }, [handleKeyPress, setLetters, word]);

  return (
    <React.Suspense>
      <div className="grid place-items-center p-2">
        <input autoFocus className="hidden" aria-hidden="true" />
        <motion.div
          className="flex gap-2 flex-wrap justify-center md:flex-nowrap"
          // shake when failedattempts increases
          variants={shakeContainer}
          animate={controls}
        >
          {word.split('').map((letter, index) => {
            return (
              <motion.div
                initial={{
                  x: index * 25,
                }}
                animate={{
                  x: 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 20,
                  mass: 1,
                  delay: index * 0.05,
                  duration: 0.5,
                }}
                key={index}
                className={cn([
                  'w-8 aspect-square border-b capitalize grid place-items-center',
                  'bg-zinc-100 dark:bg-zinc-900 border-b-zinc-700 dark:border-b-zinc-600',
                  stats.maxAttemptsReached && 'bg-rose-100 dark:bg-rose-950 border-b-rose-700 dark:border-b-rose-600',
                  stats.hasWon && 'bg-emerald-200 dark:bg-emerald-900 border-b-emerald-700 dark:border-b-emerald-600',
                ])}
              >
                {stats.correctLetters.includes(letter) || stats.hasWon || stats.maxAttemptsReached ? letter : null}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </React.Suspense>
  );
};

export const FailedAttemptsCounter = () => {
  const [failedAttempts] = useAtom(failedAttemptsAtom);
  const [stats] = useAtom(hangmanStatsAtom);

  const maxAttempts = 6;

  return (
    <div
      className={cn([
        'text-xl text-zinc-600 dark:text-zinc-400',
        stats.maxAttemptsReached && 'text-rose-400 dark:text-rose-900',
        stats.hasWon && 'text-emerald-600 dark:text-emerald-400',
      ])}
    >
      <span>Attempts Left: </span>
      <NumberFlow value={maxAttempts - failedAttempts} />
    </div>
  );
};

export const ResetHangman = () => {
  const [stats] = useAtom(hangmanStatsAtom);
  const resetHistory = useResetAtom(lettersAtom);
  const resetFailedAttempts = useResetAtom(failedAttemptsAtom);
  const [, resetWord] = useAtom(uniqueWordAtom);

  const reset = () => {
    resetHistory();
    resetFailedAttempts();
    resetWord();
  };

  return <Button onClick={reset}>{stats.hasWon || stats.maxAttemptsReached ? 'Play Again' : 'Restart'}</Button>;
};
