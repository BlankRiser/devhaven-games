'use client';

import { FlappyBirdCanvas } from './flappy-bird-assets';

export default function FlappyBird() {
  return (
    <section className="border rounded-md border-zinc-200 dark:border-zinc-800 w-full h-full overflow-hidden">
      <div className="grid place-items-center h-full w-full py-4">
        <FlappyBirdCanvas />
      </div>
    </section>
  );
}
