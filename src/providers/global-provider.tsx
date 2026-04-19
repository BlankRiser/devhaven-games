'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ThemeProvider } from 'next-themes';
import { AppSidebar } from '@/components/navigation/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { MobileBanner } from '@/features/common/mobile-banner';
import { GAMES_LIST } from '@/features/games-list';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchInterval: false,
    },
  },
});

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="theme">
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-b-zinc-200 dark:border-b-zinc-800 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex justify-between items-center w-full">
                <GameName />
                <ThemeSwitcher />
              </div>
            </header>
            <MobileBanner />
            <div className="bg-zinc-50 dark:bg-zinc-950 min-h-[calc(100dvh-var(--spacing)*16)]">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

const GameName = () => {
  const { slug } = useParams<{ slug: string }>();
  const game = GAMES_LIST.find((game) => game.slug === slug);
  return <h1 className="text-xl font-medium">{game?.label}</h1>;
};
