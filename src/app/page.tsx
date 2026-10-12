'use client';

import {
  ArrowRightIcon,
  CardsIcon,
  CheckerboardIcon,
  GameControllerIcon,
  JoystickIcon,
  MagnifyingGlassIcon,
  PuzzlePieceIcon,
  UsersIcon,
  XIcon,
} from '@phosphor-icons/react';
import { matchSorter } from 'match-sorter';
import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  GAME_CATEGORIES,
  getVisibleGames,
  type GameCategoryId,
} from '@/features/games-list';

const CATEGORY_ICONS: Record<GameCategoryId, React.ComponentType<{ className?: string }>> = {
  'board-games': CheckerboardIcon,
  '2d-platformer': JoystickIcon,
  'word-puzzle': PuzzlePieceIcon,
  'card-games': CardsIcon,
};

export default function Home() {
  const [ searchQuery, setSearchQuery ] = React.useState('');
  const [ activeCategory, setActiveCategory ] = React.useState<GameCategoryId | 'all'>('all');

  const visibleGames = React.useMemo(() => getVisibleGames(), []);

  const filteredGames = React.useMemo(() => {
    const byCategory =
      activeCategory === 'all'
        ? visibleGames
        : visibleGames.filter((game) => game.category === activeCategory);

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return byCategory;
    }

    return matchSorter(byCategory, trimmed, {
      keys: [ 'label', 'description', 'categoryLabel', 'players', 'tags' ],
    });
  }, [ visibleGames, activeCategory, searchQuery ]);

  const displayedCategories = React.useMemo(() => {
    const categoriesToConsider =
      activeCategory === 'all'
        ? GAME_CATEGORIES
        : GAME_CATEGORIES.filter((cat) => cat.id === activeCategory);

    return categoriesToConsider
      .map((category) => ({
        ...category,
        games: filteredGames.filter((game) => game.category === category.id),
      }))
      .filter((group) => group.games.length > 0 || activeCategory === group.id);
  }, [ activeCategory, filteredGames ]);

  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      {/* Gaming Index Hero & Search Bar */}
      <section className="border-b-2 border-foreground/80 px-6 py-8 md:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 border border-border bg-secondary/60 px-2.5 py-1 text-xs leading-4 font-light tracking-widest text-secondary-foreground uppercase">
              <GameControllerIcon className="size-3.5" weight="fill" />
              <span>Local Arcade Library</span>
            </div>
            <h1 className="mt-3 font-heading text-[48px] leading-[48px] font-medium tracking-[-0.025em] uppercase">
              Choose Your Game
            </h1>
            <p className="mt-2 max-w-[65ch] text-xs leading-4 font-light text-muted-foreground">
              Browse offline single-player and local multiplayer games by genre. Pick a title below
              and jump straight in on the same screen.
            </p>
          </div>

          {/* Search Input powered by match-sorter */}
          <div className="w-full lg:max-w-sm">
            <label
              htmlFor="game-search"
              className="block text-xs leading-4 font-light tracking-wider text-muted-foreground uppercase">
              Search Library ({filteredGames.length}{' '}
              {filteredGames.length === 1 ? 'Game' : 'Games'})
            </label>
            <div className="relative mt-1.5 flex items-center border border-border bg-card px-3">
              <MagnifyingGlassIcon className="size-4 shrink-0 text-muted-foreground" />
              <Input
                id="game-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, genre, or tag..."
                className="h-10 border-0 bg-transparent px-2.5 text-xs focus-visible:border-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="text-muted-foreground transition-colors hover:text-foreground">
                  <XIcon className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter Strip */}
      <section className="flex flex-wrap items-center border-b border-border bg-secondary/30">
        <button
          type="button"
          onClick={() => setActiveCategory('all')}
          className={`flex items-center gap-2 border-r border-b border-border px-5 py-3 text-xs leading-4 tracking-wider uppercase transition-colors sm:border-b-0 ${
            activeCategory === 'all'
              ? 'bg-primary font-medium text-primary-foreground'
              : 'bg-transparent font-light text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}>
          <span>All Games</span>
          <span className="opacity-70">({visibleGames.length})</span>
        </button>

        {GAME_CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category.id];
          const count = visibleGames.filter((g) => g.category === category.id).length;
          const isSelected = activeCategory === category.id;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 border-r border-b border-border px-5 py-3 text-xs leading-4 tracking-wider uppercase transition-colors sm:border-b-0 ${
                isSelected
                  ? 'bg-primary font-medium text-primary-foreground'
                  : 'bg-transparent font-light text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}>
              <Icon className="size-3.5" />
              <span>{category.label}</span>
              <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </section>

      {/* Categorized Game Sections */}
      <div className="flex flex-1 flex-col divide-y-2 divide-foreground/80">
        {filteredGames.length === 0 && activeCategory === 'all' ? (
          <section className="grid flex-1 place-items-center p-12 text-center">
            <div className="flex max-w-md flex-col items-center">
              <GameControllerIcon className="size-8 text-muted-foreground" />
              <h2 className="mt-3 font-heading text-3xl leading-none font-medium tracking-[-0.025em] uppercase">
                No Matching Games
              </h2>
              <p className="mt-2 text-xs leading-4 font-light text-muted-foreground">
                No games matched &ldquo;{searchQuery}&rdquo;. Try another keyword or clear your
                search filter.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}>
                Reset Filters
              </Button>
            </div>
          </section>
        ) : (
          displayedCategories.map((categoryGroup) => {
            const CategoryIcon = CATEGORY_ICONS[categoryGroup.id];

            return (
              <section key={categoryGroup.id} className="flex flex-col">
                {/* Category Header */}
                <div className="flex flex-col justify-between gap-2 border-b border-border bg-secondary/20 px-6 py-4 sm:flex-row sm:items-center md:px-8">
                  <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center border border-border bg-card text-foreground">
                      <CategoryIcon className="size-4" />
                    </div>
                    <div>
                      <h2 className="font-heading text-2xl leading-none font-medium tracking-[-0.025em] uppercase">
                        {categoryGroup.label}
                      </h2>
                      <p className="mt-0.5 text-xs leading-4 font-light text-muted-foreground">
                        {categoryGroup.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs leading-4 font-light tracking-widest text-muted-foreground uppercase">
                    {categoryGroup.games.length}{' '}
                    {categoryGroup.games.length === 1 ? 'Title' : 'Titles'}
                  </span>
                </div>

                {/* Category Games Grid */}
                {categoryGroup.games.length === 0 ? (
                  <div className="flex flex-col items-start justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center md:px-8">
                    <p className="text-xs leading-4 font-light text-muted-foreground">
                      {searchQuery
                        ? `No ${categoryGroup.label.toLowerCase()} matched "${searchQuery}".`
                        : `New ${categoryGroup.label.toLowerCase()} are currently in development.`}
                    </p>
                    {(searchQuery || activeCategory !== 'all') && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => {
                          setSearchQuery('');
                          setActiveCategory('all');
                        }}>
                        View All Games
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
                    {categoryGroup.games.map((game) => {
                      const isReady = game.status === 'completed';

                      return (
                        <article
                          key={game.slug}
                          className="group relative flex flex-col justify-between border-b border-border bg-card/60 px-6 pb-6 transition-colors hover:bg-secondary/50 sm:border-r sm:last:border-r-0">
                          {/* 12px top offset to Eyebrow */}
                          <div className="pt-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 text-xs leading-4 font-light tracking-wider text-muted-foreground uppercase">
                                <UsersIcon className="size-3.5" />
                                {game.players}
                              </span>
                              <span
                                className={
                                  isReady
                                    ? 'border border-tertiary-foreground/20 bg-tertiary px-2 py-0.5 text-[10px] leading-4 font-medium tracking-widest text-tertiary-foreground uppercase'
                                    : 'border border-border bg-secondary px-2 py-0.5 text-[10px] leading-4 font-light tracking-widest text-secondary-foreground uppercase'
                                }>
                                {isReady ? 'Ready' : 'Beta / WIP'}
                              </span>
                            </div>

                            {/* 6px gap to Title block */}
                            <div className="mt-1.5 flex items-start justify-between gap-3">
                              <h3 className="font-heading text-3xl leading-none font-medium tracking-[-0.025em] text-foreground uppercase">
                                {game.label}
                              </h3>
                              <GameControllerIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                            </div>

                            {/* 8px gap to Description copy (IBM Plex Mono 12px / 300 / 16px) */}
                            <p className="mt-2 max-w-[65ch] text-xs leading-4 font-light text-muted-foreground">
                              {game.description}
                            </p>
                          </div>

                          {/* 8px gap to CTA button */}
                          <div className="mt-2 pt-4">
                            <Button
                              variant="default"
                              size="sm"
                              render={<Link href={game.url} />}
                              className="w-full justify-between">
                              <span>Play Now</span>
                              <ArrowRightIcon data-icon="inline-end" />
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
