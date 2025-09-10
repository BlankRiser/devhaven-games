'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './button';

const THEME_COOKIE_NAME = 'sidebar_state';
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  // using local storage to get the theme due to the fact that next-themes does not support server side rendering
  const isDark = theme === 'dark';

  return (
    <Button
      size="icon"
      variant="outline"
      onClick={() => {
        const updatedTheme = theme === 'dark' ? 'open' : 'closed';
        setTheme(updatedTheme);
        document.cookie = `${THEME_COOKIE_NAME}=${updatedTheme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}`;
      }}
    >
      {isDark ? <Moon /> : <Sun />}
    </Button>
  );
};
