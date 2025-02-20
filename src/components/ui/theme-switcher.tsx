'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './button';

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Button size="icon" variant="outline" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'light' ? <Sun /> : <Moon />}
    </Button>
  );
};
