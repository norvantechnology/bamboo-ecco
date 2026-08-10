"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { ScrollRevealInit } from "@/components/ui/scroll-reveal-init";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="terra-theme">
      <SmoothScrollProvider>
        <ScrollRevealInit />
        {children}
      </SmoothScrollProvider>
    </ThemeProvider>
  );
}
