"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/motion";

interface Props {
  children: ReactNode;
  className?: string;
}

/** Initializes GSAP ScrollTrigger animations for homepage sections */
export function HomeMotionRoot({ children, className }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    // Always show section titles immediately — never leave them at opacity 0
    const revealTitles = () => {
      rootRef.current?.querySelectorAll<HTMLElement>("[data-scroll-reveal]").forEach((el) => {
        el.classList.add("scroll-reveal--visible");
      });
    };
    revealTitles();
    // Catch late paint / hydration
    const t = window.setTimeout(revealTitles, 100);

    // Mobile / reduced motion: skip card entrance animations
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (prefersReducedMotion() || isMobile) {
      return () => window.clearTimeout(t);
    }

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapMod, stMod]) => {
      if (cancelled || !rootRef.current) return;

      const gsap = gsapMod.default;
      gsap.registerPlugin(stMod.ScrollTrigger);

      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-collection-card]").forEach((card, i) => {
          gsap.from(card, {
            scrollTrigger: {
              trigger: card,
              start: "top 92%",
              once: true,
            },
            y: 40,
            opacity: 0,
            duration: 0.75,
            delay: i * 0.06,
            ease: "power2.out",
            clearProps: "opacity,transform",
          });
        });

        const productGrids = gsap.utils.toArray<HTMLElement>("[data-product-grid]");
        productGrids.forEach((grid) => {
          const cards = grid.querySelectorAll("[data-product-card-3d]");
          if (!cards.length) return;

          gsap.from(cards, {
            scrollTrigger: {
              trigger: grid,
              start: "top 90%",
              once: true,
            },
            y: 36,
            opacity: 0,
            stagger: 0.05,
            duration: 0.7,
            ease: "power2.out",
            clearProps: "opacity,transform",
          });
        });

        gsap.from("[data-pillar-card]", {
          scrollTrigger: {
            trigger: "[data-pillars-grid]",
            start: "top 90%",
            once: true,
          },
          y: 28,
          opacity: 0,
          stagger: 0.1,
          duration: 0.7,
          ease: "power2.out",
          clearProps: "opacity,transform",
        });

        gsap.from("[data-review-card]", {
          scrollTrigger: {
            trigger: "[data-reviews-grid]",
            start: "top 90%",
            once: true,
          },
          y: 24,
          opacity: 0,
          stagger: 0.08,
          duration: 0.65,
          ease: "power2.out",
          clearProps: "opacity,transform",
        });

        gsap.utils.toArray<HTMLElement>("[data-lifestyle-card]").forEach((card, i) => {
          gsap.from(card, {
            scrollTrigger: { trigger: card, start: "top 92%", once: true },
            y: 32,
            opacity: 0,
            duration: 0.7,
            delay: i * 0.06,
            ease: "power2.out",
            clearProps: "opacity,transform",
          });
        });
      }, rootRef);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
