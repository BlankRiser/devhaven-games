'use client';

import { AppSidebar } from '@/components/navigation/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { ThemeProvider } from 'next-themes';

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <ThemeSwitcher />
          </header>
          <div className="bg-zinc-50 dark:bg-zinc-950">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
};
