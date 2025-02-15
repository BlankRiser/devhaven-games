"use client";

import { ThemeProvider } from "next-themes";

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider attribute="data-theme">{children}</ThemeProvider>;
};
