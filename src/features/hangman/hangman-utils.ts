import { queryOptions } from '@tanstack/react-query';
import { atom } from 'jotai';
import { atomWithReset } from 'jotai/utils';
import { atomWithQuery } from 'jotai-tanstack-query';
import { getUniqueRandomWord } from '@/lib/utils';

export const wordsAtom = atomWithQuery(() => hangmanWordQueryFactory());
const currentWordInternalAtom = atom('');
const refreshCounterAtom = atom(0);
export const uniqueWordAtom = atom(
  (get) => {
    get(refreshCounterAtom);
    const words = get(wordsAtom).data ?? [];
    const prevWord = get(currentWordInternalAtom);
    return getUniqueRandomWord(words.filter(Boolean), prevWord) || '';
  },
  (get, set) => {
    set(currentWordInternalAtom, get(uniqueWordAtom));
    set(refreshCounterAtom, (c) => c + 1);
  },
);

export const lettersAtom = atomWithReset<Array<string>>([]);
export const failedAttemptsAtom = atomWithReset(0);

export const hangmanStatsAtom = atom((get) => {
  const word = get(uniqueWordAtom);
  const letters = get(lettersAtom);
  const failedAttempts = get(failedAttemptsAtom);

  if (!word) {
    return {
      correctLetters: [],
      maxAttemptsReached: false,
      hasWon: false,
    };
  }

  return {
    correctLetters: letters.filter((letter) => word.includes(letter)),
    maxAttemptsReached: failedAttempts >= 6,
    hasWon: word.split('').every((letter) => letters.includes(letter)),
  };
});

export const figuresVisibleAtom = atom<Record<string, boolean>>((get) => {
  const failedAttempts = get(failedAttemptsAtom);
  return {
    head: failedAttempts >= 1 ? true : false,
    body: failedAttempts >= 2 ? true : false,
    handLeft: failedAttempts >= 3 ? true : false,
    handRight: failedAttempts >= 4 ? true : false,
    legLeft: failedAttempts >= 5 ? true : false,
    legRight: failedAttempts >= 6 ? true : false,
  };
});

export const hangmanWordQueryFactory = () => {
  return queryOptions({
    queryKey: [ 'wordBank' ],
    queryFn: async ({ signal }) => {
      const res = await fetch('/games/hangman-word-bank.txt', {
        signal,
      });
      if (!res.ok) {
        throw new Error('Failed to fetch word bank');
      }
      return await res.text();
    },
    select: (data) => {
      return data.split('\n');
    },
  });
};
