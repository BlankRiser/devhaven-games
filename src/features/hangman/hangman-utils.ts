import { getUniqueRandomWord } from '@/lib/utils';
import { queryOptions } from '@tanstack/react-query';
import { atom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';
import { atomWithRefresh, atomWithReset } from 'jotai/utils';

export const wordsAtom = atomWithQuery(() => hangmanWordQueryFactory());
// export const uniqueWordAtom = atomWithDefault<string>((get) => {
//   const words = get(wordsAtom).data ?? [];
//   return getUniqueRandomWord(words) ?? '';
// });
// Resettable uniqueWordAtom
export const uniqueWordAtom = atomWithRefresh<string>((get) => {
  const words = get(wordsAtom).data ?? [];
  return getUniqueRandomWord(words) ?? '';
});

export const lettersAtom = atomWithReset<Array<string>>([]);
export const failedAttemptsAtom = atomWithReset(0);

export const hangmanStatsAtom = atom((get) => {
  const word = get(uniqueWordAtom);
  const letters = get(lettersAtom);
  const failedAttempts = get(failedAttemptsAtom);

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
    queryKey: ['wordBank'],
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
