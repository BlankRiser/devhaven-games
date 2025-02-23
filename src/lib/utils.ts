import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUniqueRandomWord(words: string[]): string {
  const remainingWords = words.slice(); // Make a copy of the original array
  let unselectedCount = remainingWords.length;

  // Generate the random index, select the word and swap
  const randomIndex = Math.floor(Math.random() * unselectedCount);
  const selectedWord = remainingWords[randomIndex];

  // Swap the selected word with the last unselected word in the array
  [remainingWords[randomIndex], remainingWords[unselectedCount - 1]] = [remainingWords[unselectedCount - 1], remainingWords[randomIndex]];

  // Decrease unselectedCount
  unselectedCount--;

  // If all words have been selected, throw an error
  if (unselectedCount === 0) {
    throw new Error('All words have been selected!');
  }

  return selectedWord;
}
