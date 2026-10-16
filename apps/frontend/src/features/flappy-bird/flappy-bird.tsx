"use client";

import { FlappyBirdCanvas } from "./flappy-bird-assets";

export default function FlappyBird() {
  return (
    <section className="bg-background relative flex h-full w-full flex-1 flex-col overflow-hidden">
      <FlappyBirdCanvas />
    </section>
  );
}
