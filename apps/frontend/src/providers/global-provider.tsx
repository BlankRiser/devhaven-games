"use client";

import { UsersThreeIcon } from "@phosphor-icons/react";
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
}) => {
  return (
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
};

const GameName = () => {
  const { slug } = useParams<{ slug: string }>();
  const activeGame = GAMES_LIST.find((item) => item.slug === slug);

  if (!activeGame) {
    return <div />;
  }

  return (
    <div className="flex items-center gap-2.5">
      <h1 className="font-heading text-2xl leading-none font-medium tracking-[-0.025em] uppercase">
        {activeGame.label}
      </h1>
      {activeGame.supportsMultiplayer === true ? (
        <span className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 inline-flex items-center justify-center border p-1">
          <UsersThreeIcon className="size-3.5" weight="fill" aria-hidden="true" />
          <span className="sr-only">Multiplayer Supported</span>
        </span>
      ) : null}
    </div>
  );
}
