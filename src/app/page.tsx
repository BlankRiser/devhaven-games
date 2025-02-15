"use client";

import { ThemeSwitcher } from "@/components/ui/theme-switcher";

export default function Home() {
  return (
    <div className="bg-background min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <ThemeSwitcher />
    </div>
  );
}
