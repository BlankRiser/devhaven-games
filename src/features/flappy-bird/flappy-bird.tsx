'use client';

import { FlappyBirdCanvas } from './flappy-bird-assets';

export default function FlappyBird() {
  return (
    <section className="relative h-full w-full overflow-hidden border border-border bg-card">
      <FlappyBirdCanvas />
    </section>
  );
}
