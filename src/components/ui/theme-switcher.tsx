'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './button';
import { cn } from '@/lib/utils';

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  // using local storage to get the theme due to the fact that next-themes does not support server side rendering
  const isDark = theme === 'dark';

  return (
    <Button size="icon" variant="outline" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      <Sun className={cn([isDark ? 'hidden' : 'block'])} />
      <Moon className={cn([!isDark ? 'hidden' : 'block'])} />
    </Button>
  );
};
