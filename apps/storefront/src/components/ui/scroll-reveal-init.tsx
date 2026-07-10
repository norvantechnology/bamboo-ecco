"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/** Observes [data-scroll-reveal] elements site-wide — once-only fade-up. */
export function ScrollRevealInit() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      document.querySelectorAll("[data-scroll-reveal]").forEach((el) => {
        el.classList.add("scroll-reveal--visible");
      });
      return;
    }

    const nodes = document.querySelectorAll<HTMLElement>("[data-scroll-reveal]:not(.scroll-reveal--visible)");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("scroll-reveal--visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  return null;
}
