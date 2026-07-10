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
    if (prefersReducedMotion() || !rootRef.current) return;

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
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
            y: 70,
            rotateX: 18,
            opacity: 0,
            duration: 1,
            delay: i * 0.08,
            ease: "power3.out",
            transformOrigin: "center bottom",
          });
        });

        const productGrids = gsap.utils.toArray<HTMLElement>("[data-product-grid]");
        productGrids.forEach((grid) => {
          const cards = grid.querySelectorAll("[data-product-card-3d]");
          if (!cards.length) return;

          gsap.from(cards, {
            scrollTrigger: {
              trigger: grid,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
            y: 55,
            rotateY: -6,
            opacity: 0,
            stagger: 0.07,
            duration: 0.85,
            ease: "power2.out",
            transformPerspective: 1000,
          });
        });

        gsap.from("[data-pillar-card]", {
          scrollTrigger: {
            trigger: "[data-pillars-grid]",
            start: "top 82%",
          },
          y: 40,
          opacity: 0,
          stagger: 0.12,
          duration: 0.9,
          ease: "power2.out",
        });

        gsap.from("[data-review-card]", {
          scrollTrigger: {
            trigger: "[data-reviews-grid]",
            start: "top 85%",
          },
          scale: 0.92,
          y: 30,
          opacity: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: "back.out(1.1)",
        });

        gsap.utils.toArray<HTMLElement>("[data-lifestyle-card]").forEach((card, i) => {
          const img = card.querySelector("[data-lifestyle-img]");
          gsap.from(card, {
            scrollTrigger: { trigger: card, start: "top 90%" },
            y: 50,
            opacity: 0,
            duration: 0.9,
            delay: i * 0.1,
            ease: "power2.out",
          });
          if (img) {
            gsap.to(img, {
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: 1.2,
              },
              y: -30,
              ease: "none",
            });
          }
        });
      }, rootRef);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
