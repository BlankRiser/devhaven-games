'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GAMES_LIST } from '@/features/games-list';
import Link from 'next/link';

export default function Home() {
  return (
    <div className=" min-h-screen p-2 font-[family-name:var(--font-geist-sans)]">
      <section className="flex flex-col gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {GAMES_LIST.map((game) => {
            return (
              <Link href={game.url} key={game.slug}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{game.label}</CardTitle>
                    <CardDescription>{game.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
