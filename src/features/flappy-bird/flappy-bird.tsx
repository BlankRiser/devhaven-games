'use client';

import { FlappyBirdCanvas } from './flappy-bird-assets';

export default function FlappyBird() {
  return (
    <section className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background">
      <FlappyBirdCanvas />
    </section>
  );
}
