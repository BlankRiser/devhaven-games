'use client';

import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { GAMES_LIST } from '@/features/games-list';

export default function GameSlugPage() {
  const { slug } = useParams<{ slug: string }>();

  const game = GAMES_LIST.find((game) => game.slug === slug);
  const GameComponent = game?.component

  if (!GameComponent) {
    return <div>Game not found</div>;
  }

  return (
    <div className="h-full p-2">
      <Suspense fallback={<div className='bg-red-500 w-50vw h-50vh'>loading...</div>}>
        <section className="w-full h-full grid place-items-center">
          <GameComponent />
        </section>
      </Suspense>
    </div>
  );
}
