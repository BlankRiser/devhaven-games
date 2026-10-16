"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileBanner } from "@/features/common/mobile-banner";
import { GAMES_LIST } from "@/features/games-list";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchInterval: false,
    },
  },
});

export const GlobalProvider = ({
  children,
}: {
  readonly children: React.ReactNode;
}) => (
  <ThemeProvider
    attribute="class"
    defaultTheme="light"
    enableSystem={false}
    storageKey="theme"
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="border-border bg-background flex h-14 shrink-0 items-center gap-3 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-1 h-full" />
              <div className="flex w-full items-center justify-between gap-4">
                <GameName />
                <ThemeSwitcher />
              </div>
            </header>
            <MobileBanner />
            <div className="bg-background flex min-h-0 flex-1 flex-col">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

const GameName = () => {
  const { slug } = useParams<{ slug: string }>();
  const game = GAMES_LIST.find((game) => game.slug === slug);

  if (!game) {
    return <div />;
  }

  return (
    <h1 className="font-heading text-2xl leading-none font-medium tracking-[-0.025em] uppercase">
      {game.label}
    </h1>
  );
};
