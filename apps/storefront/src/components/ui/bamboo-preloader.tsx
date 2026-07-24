"use client";

import { useEffect } from "react";

export function BambooPreloader() {
  useEffect(() => {
    // Dismiss preloader once page settles
    const dismiss = () => {
      const el = document.getElementById("bamboo-root-preloader");
      if (!el) return;
      el.style.opacity = "0";
      el.style.visibility = "hidden";
      setTimeout(() => {
        el.remove();
      }, 650);
    };

    // Fast dismissal: 800ms
    const timer = setTimeout(dismiss, 800);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
