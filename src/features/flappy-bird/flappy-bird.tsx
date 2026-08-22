'use client';

import { FlappyBirdCanvas } from './flappy-bird-assets';

export default function FlappyBird() {
  return (
    <section className="relative border rounded-md border-zinc-200 dark:border-zinc-800 w-full h-full overflow-hidden">
      <FlappyBirdCanvas />
    </section>
  );
}
