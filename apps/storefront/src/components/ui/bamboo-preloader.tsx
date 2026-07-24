"use client";

import { useEffect } from "react";

export function BambooPreloader() {
  useEffect(() => {
    // Dismiss preloader safely without removing DOM nodes to prevent React hydration errors
    const dismiss = () => {
      const el = document.getElementById("bamboo-root-preloader");
      if (!el) return;
      el.style.opacity = "0";
      el.style.visibility = "hidden";
      el.style.pointerEvents = "none";
      setTimeout(() => {
        el.style.display = "none";
      }, 650);
    };

    // Fast dismissal: 800ms
    const timer = setTimeout(dismiss, 800);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
