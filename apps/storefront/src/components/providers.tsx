"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { ScrollRevealInit } from "@/components/ui/scroll-reveal-init";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="terra-theme">
      <ScrollRevealInit />
      {children}
    </ThemeProvider>
  );
}
