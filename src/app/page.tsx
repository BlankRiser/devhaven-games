'use client';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GAMES_LIST } from '@/features/games-list';
import Link from 'next/link';

export default function Home() {
  return (
    <div className=" min-h-screen p-2 font-[family-name:var(--font-geist-sans)]">
      <section className="flex flex-col gap-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {GAMES_LIST.map((game) => {
            return (
              <Card key={game.slug}>
                <CardHeader>
                  <CardTitle>{game.label}</CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button asChild variant="link" className="ml-auto">
                    <Link href={game.url}>Play</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
