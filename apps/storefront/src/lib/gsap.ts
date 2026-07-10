import type { gsap as GsapType } from "gsap";

type GsapModule = typeof GsapType;

let gsapPromise: Promise<GsapModule> | null = null;

/** Lazy-load GSAP so listing pages avoid pulling it into the initial bundle. */
export function loadGsap(): Promise<GsapModule> {
  if (!gsapPromise) {
    gsapPromise = import("gsap").then((mod) => mod.default ?? mod);
  }
  return gsapPromise;
}
