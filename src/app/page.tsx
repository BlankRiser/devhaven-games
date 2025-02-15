"use client";

import { ThemeSwitch } from "@/components/ui/theme-switcher";

export default function Home() {
  return (
    <div className="bg-red-800 dark:bg-green-800 min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <ThemeSwitch />
    </div>
  );
}
