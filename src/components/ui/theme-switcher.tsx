'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <div className="relative inline-grid h-9 grid-cols-[1fr_1fr] items-center text-sm font-medium">
        <Switch
          id="theme-switch-toggle"
          checked={theme === 'dark'}
          aria-checked={theme === 'dark'}
          onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="peer absolute inset-0 h-[inherit] w-auto data-[state=checked]:bg-zinc-200/50 data-[state=unchecked]:bg-zinc-200/50 [&_span]:h-full [&_span]:w-1/2 [&_span]:transition-transform [&_span]:duration-300 [&_span]:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] data-[state=checked]:[&_span]:translate-x-full rtl:data-[state=checked]:[&_span]:-translate-x-full dark:data-[state=checked]:bg-zinc-800/50 dark:data-[state=unchecked]:bg-zinc-800/50"
        />
        <span className="pointer-events-none relative ms-0.5 flex min-w-8 items-center justify-center text-center peer-data-[state=checked]:text-zinc-500/70 dark:peer-data-[state=checked]:text-zinc-400/70">
          <Moon size={16} strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="pointer-events-none relative me-0.5 flex min-w-8 items-center justify-center text-center peer-data-[state=unchecked]:text-zinc-500/70 dark:peer-data-[state=unchecked]:text-zinc-400/70">
          <Sun size={16} strokeWidth={2} aria-hidden="true" />
        </span>
      </div>
      <Label htmlFor="theme-switch-toggle" className="sr-only">
        Theme toggle switch
      </Label>
    </div>
  );
};
