'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { GAMES_LIST } from '@/features/games-list';

export default function GameSlugPage() {
  const { slug } = useParams<{ slug: string }>();

  const game = GAMES_LIST.find((game) => game.slug === slug);
  const GameComponent = game?.component;

  if (!GameComponent) {
    return (
      <div className="grid h-full place-items-center p-6 text-xs tracking-widest text-muted-foreground uppercase">
        Module not found in manifest
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col p-3 md:p-6">
      <Suspense
        fallback={
          <div className="grid h-full w-full place-items-center border border-border bg-card p-6">
            <Skeleton className="h-48 w-48" />
          </div>
        }>
        <section className="grid h-full w-full flex-1 place-items-center">
          <GameComponent />
        </section>
      </Suspense>
    </div>
  );
}
