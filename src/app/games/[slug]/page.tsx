'use client';

import { GAMES_LIST } from '@/features/games-list';
import { useParams } from 'next/navigation';

export default function GameSlugPage() {
  const { slug } = useParams<{ slug: string }>();

  const game = GAMES_LIST.find((game) => game.slug === slug);

  return (
    <div className="h-full p-2">
      <section className="w-full h-full grid place-items-center">{game?.component()}</section>
    </div>
  );
}
