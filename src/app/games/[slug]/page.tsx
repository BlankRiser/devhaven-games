'use client';

import { TicTacToe } from '@/features/tic-tac-toe/tic-tac-toe';
import { useParams } from 'next/navigation';

export default function GameSlugPage() {
  const { slug } = useParams<{ slug: string }>();

  const game = GamesList.find((game) => game.slug === slug);

  return (
    <div className="h-full p-2">
      <section className="w-full h-full grid place-items-center">{game?.component()}</section>
    </div>
  );
}

const GamesList = [
  {
    slug: 'tic-tac-toe',
    component: TicTacToe,
  },
];
