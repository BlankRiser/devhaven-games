"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { GAMES_LIST } from "@/features/games-list";

interface GameViewProperties {
  readonly slug: string;
}

export const GameView = ({ slug }: GameViewProperties) => {
  const game = GAMES_LIST.find((item) => item.slug === slug);
  const GameComponent = game?.component;

  if (!GameComponent) {
    return (
      <div className="text-muted-foreground grid h-full place-items-center p-6 text-xs tracking-widest uppercase">
        Module not found in manifest
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100svh-3.5rem)] w-full flex-1 flex-col overflow-hidden">
      <Suspense
        fallback={
          <div className="bg-card grid h-full w-full place-items-center p-6">
            <Skeleton className="h-48 w-48" />
          </div>
        }
      >
        <section className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
          <GameComponent />
        </section>
      </Suspense>
    </div>
  );
};
