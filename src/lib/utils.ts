import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUniqueRandomWord(words: string[], currentWord?: string): string {
  // Filter out the current word if provided, but only if there are other words available
  let availableWords = words;
  if (currentWord && words.length > 1) {
    availableWords = words.filter((word) => word !== currentWord);
  }

  if (availableWords.length === 0) {
    if (words.length > 0) {
      // Fallback to picking any word if filtering left us with nothing (e.g. only one word exists)
      return words[Math.floor(Math.random() * words.length)];
    }
    return ''; // Return empty string instead of throwing
  }

  // Pick a random word from the available list
  const randomIndex = Math.floor(Math.random() * availableWords.length);
  return availableWords[randomIndex];
}
