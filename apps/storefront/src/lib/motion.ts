/** Shared motion tokens — fast, subtle, respects reduced motion */
export const MOTION = {
  fast: 150,
  base: 220,
  slow: 320,
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const MOTION_EASE = {
  smooth: "power3.out",
  wood: "power2.inOut",
  snap: "back.out(1.2)",
} as const;
