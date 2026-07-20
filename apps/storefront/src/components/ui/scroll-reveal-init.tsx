"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";

const SELECTOR = "[data-scroll-reveal]";
const VISIBLE = "scroll-reveal--visible";

function reveal(el: Element) {
  el.classList.add(VISIBLE);
}

/**
 * Observes [data-scroll-reveal] site-wide.
 * Handles dynamically mounted homepage sections (lazy-loaded after first paint).
 */
export function ScrollRevealInit() {
  useEffect(() => {
    const reduced = prefersReducedMotion();

    const revealAll = () => {
      document.querySelectorAll(SELECTOR).forEach(reveal);
    };

    if (reduced) {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          reveal(entry.target);
          observer.unobserve(entry.target);
        });
      },
      // Generous margin so titles near the fold still trigger on mobile
      { rootMargin: "0px 0px 12% 0px", threshold: 0.01 },
    );

    const watch = (root: ParentNode = document) => {
      root.querySelectorAll<HTMLElement>(`${SELECTOR}:not(.${VISIBLE})`).forEach((node) => {
        observer.observe(node);
      });
    };

    watch();

    // Homepage sections mount via dynamic import after this effect — catch them
    const mutation = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches?.(SELECTOR) || node.querySelector?.(SELECTOR)) {
            watch(node);
          }
        });
      }
    });

    mutation.observe(document.body, { childList: true, subtree: true });

    // Safety net: never leave titles invisible if observer missed them
    const safety = window.setTimeout(revealAll, 2500);

    // Re-check after fonts/layout settle (common mobile race)
    const onLoad = () => watch();
    window.addEventListener("load", onLoad);
    requestAnimationFrame(() => watch());

    return () => {
      observer.disconnect();
      mutation.disconnect();
      window.clearTimeout(safety);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return null;
}
