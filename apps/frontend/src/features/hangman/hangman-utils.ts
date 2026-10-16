import { queryOptions } from "@tanstack/react-query";
import { atom } from "jotai";
import { atomWithReset } from "jotai/utils";
import { atomWithQuery } from "jotai-tanstack-query";

export type HangmanDifficultyId = "all" | "easy" | "medium" | "hard";

export type HangmanStatus = "loading" | "playing" | "won" | "lost";

export const MAX_ATTEMPTS = 6;
export const MAX_HINTS = 2;

export const HANGMAN_DIFFICULTIES: Record<
  HangmanDifficultyId,
  {
    id: HangmanDifficultyId;
    label: string;
    minLength: number;
    maxLength: number;
  }
> = {
  all: { id: "all", label: "All Words", minLength: 4, maxLength: 12 },
  easy: { id: "easy", label: "Easy (4–6)", minLength: 4, maxLength: 6 },
  medium: { id: "medium", label: "Medium (7–9)", minLength: 7, maxLength: 9 },
  hard: { id: "hard", label: "Hard (10+)", minLength: 10, maxLength: 14 },
};

const FALLBACK_WORDS = [
  "arcade",
  "joystick",
  "platform",
  "strategy",
  "terminal",
  "keyboard",
  "checkpoint",
  "labyrinth",
  "controller",
  "algorithm",
];

export const hangmanWordQueryFactory = () => {
  return queryOptions({
    queryKey: ["wordBank"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/games/hangman-word-bank.txt", {
        signal,
      });
      if (!res.ok) {
        throw new Error("Failed to fetch word bank");
      }
      return await res.text();
    },
    select: (data) => {
      return data
        .split(/\r?\n/)
        .map((word) => word.trim().toLowerCase())
        .filter((word) => /^[a-z]{4,14}$/.test(word));
    },
    staleTime: Infinity,
  });
};

export const wordsAtom = atomWithQuery(() => hangmanWordQueryFactory());

export const hangmanDifficultyAtom = atom<HangmanDifficultyId>("all");

const wordRandomSeedAtom = atom<number>(Math.random());

export const uniqueWordAtom = atom(
  (get) => {
    const seed = get(wordRandomSeedAtom);
    const difficulty = HANGMAN_DIFFICULTIES[get(hangmanDifficultyAtom)];
    const rawWords = get(wordsAtom).data ?? FALLBACK_WORDS;
    const filtered = rawWords.filter(
      (w) =>
        w.length >= difficulty.minLength && w.length <= difficulty.maxLength
    );
    const pool =
      filtered.length > 0
        ? filtered
        : rawWords.length > 0
          ? rawWords
          : FALLBACK_WORDS;
    const index = Math.floor(seed * pool.length) % pool.length;
    return pool[index] ?? "arcade";
  },
  (get, set) => {
    const previousWord = get(uniqueWordAtom);
    const difficulty = HANGMAN_DIFFICULTIES[get(hangmanDifficultyAtom)];
    const rawWords = get(wordsAtom).data ?? FALLBACK_WORDS;
    const filtered = rawWords.filter(
      (w) =>
        w.length >= difficulty.minLength && w.length <= difficulty.maxLength
    );
    const pool =
      filtered.length > 0
        ? filtered
        : rawWords.length > 0
          ? rawWords
          : FALLBACK_WORDS;

    let nextSeed = Math.random();
    if (pool.length > 1) {
      let attempts = 0;
      while (
        pool[Math.floor(nextSeed * pool.length) % pool.length] ===
          previousWord &&
        attempts < 10
      ) {
        nextSeed = Math.random();
        attempts++;
      }
    }

    set(wordRandomSeedAtom, nextSeed);
  }
);

export const lettersAtom = atomWithReset<string[]>([]);
export const hintedLettersAtom = atomWithReset<string[]>([]);
export const failedAttemptsAtom = atom((get) => {
  const word = get(uniqueWordAtom);
  const letters = get(lettersAtom);
  return word ? letters.filter((letter) => !word.includes(letter)).length : 0;
});
export const hangmanErrorAtom = atomWithReset<{
  title: string;
  message: string;
} | null>(null);

export const getRandomUnrevealedLetter = (
  word: string,
  revealedLetters: string[]
): string | null => {
  const uniqueUnrevealed = [...new Set(word.split(""))].filter(
    (letter) => !revealedLetters.includes(letter)
  );

  return uniqueUnrevealed.length === 0
    ? null
    : (uniqueUnrevealed[Math.floor(Math.random() * uniqueUnrevealed.length)] ??
        null);
};

export const hangmanStatsAtom = atom((get) => {
  const query = get(wordsAtom);
  const word = get(uniqueWordAtom);
  const guessedLetters = get(lettersAtom);
  const hintedLetters = get(hintedLettersAtom);

  if (!word) {
    return {
      word: "",
      guessedLetters: [] as string[],
      correctLetters: [] as string[],
      wrongLetters: [] as string[],
      failedAttempts: 0,
      attemptsRemaining: MAX_ATTEMPTS,
      maxAttempts: MAX_ATTEMPTS,
      maxAttemptsReached: false,
      hasWon: false,
      hintsRemaining: MAX_HINTS,
      status: "loading",
    };
  }

  const correctLetters = guessedLetters.filter((letter) =>
    word.includes(letter)
  );
  const wrongLetters = guessedLetters.filter(
    (letter) => !word.includes(letter)
  );
  const failedAttempts = wrongLetters.length;
  const isMaxAttemptsReached = failedAttempts >= MAX_ATTEMPTS;
  const hasWon =
    !isMaxAttemptsReached &&
    word.split("").every((letter) => correctLetters.includes(letter));

  const uniqueUnrevealedCount = [...new Set(word.split(""))].filter(
    (letter) => !correctLetters.includes(letter)
  ).length;

  const hintsRemaining =
    isMaxAttemptsReached || hasWon || uniqueUnrevealedCount <= 1
      ? 0
      : Math.max(0, MAX_HINTS - hintedLetters.length);

  let status: HangmanStatus = "playing";
  if (query.isPending && !word) {
    status = "loading";
  } else if (hasWon) {
    status = "won";
  } else if (isMaxAttemptsReached) {
    status = "lost";
  }

  return {
    word,
    guessedLetters,
    correctLetters,
    wrongLetters,
    failedAttempts,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - failedAttempts),
    maxAttempts: MAX_ATTEMPTS,
    maxAttemptsReached: isMaxAttemptsReached,
    hasWon,
    hintsRemaining,
    status,
  };
});

export const figuresVisibleAtom = atom<Record<string, boolean>>((get) => {
  const failedAttempts = get(failedAttemptsAtom);
  return {
    head: failedAttempts >= 1,
    body: failedAttempts >= 2,
    handLeft: failedAttempts >= 3,
    handRight: failedAttempts >= 4,
    legLeft: failedAttempts >= 5,
    legRight: failedAttempts >= 6,
  };
});

export const guessLetterAtom = atom(null, (get, set, rawInput: string) => {
  const keyInput = rawInput.toLowerCase();
  const stats = get(hangmanStatsAtom);

  if (stats.maxAttemptsReached || stats.hasWon || !stats.word) {
    return;
  }

  if (!/^[a-z]$/.test(keyInput)) {
    set(hangmanErrorAtom, {
      title: "Invalid Input",
      message: "Please enter a valid letter (A–Z).",
    });
    return;
  }

  if (stats.guessedLetters.includes(keyInput)) {
    set(hangmanErrorAtom, {
      title: "Already Tried",
      message: `You already guessed "${keyInput.toUpperCase()}".`,
    });
    return;
  }

  set(lettersAtom, (previous) => [...previous, keyInput]);

  if (stats.word.includes(keyInput)) {
    set(hangmanErrorAtom, null);
  } else {
    set(hangmanErrorAtom, {
      title: "Wrong Guess",
      message: `"${keyInput.toUpperCase()}" is not in the word.`,
    });
  }
});

export const revealHintAtom = atom(null, (get, set) => {
  const stats = get(hangmanStatsAtom);
  if (
    stats.maxAttemptsReached ||
    stats.hasWon ||
    stats.hintsRemaining <= 0 ||
    !stats.word
  ) {
    return;
  }

  const revealedLetter = getRandomUnrevealedLetter(
    stats.word,
    stats.correctLetters
  );
  if (!revealedLetter) {
    return;
  }

  set(hintedLettersAtom, (previous) => [...previous, revealedLetter]);
  set(lettersAtom, (previous) =>
    previous.includes(revealedLetter) ? previous : [...previous, revealedLetter]
  );
  set(hangmanErrorAtom, null);
});

export const resetHangmanAtom = atom(null, (_get, set) => {
  set(lettersAtom, []);
  set(hintedLettersAtom, []);
  set(hangmanErrorAtom, null);
  set(uniqueWordAtom);
});

export const setHangmanDifficultyAtom = atom(
  null,
  (_get, set, difficulty: HangmanDifficultyId) => {
    set(hangmanDifficultyAtom, difficulty);
    set(lettersAtom, []);
    set(hintedLettersAtom, []);
    set(hangmanErrorAtom, null);
    set(uniqueWordAtom);
  }
);
