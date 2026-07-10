"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { MOTION_EASE, prefersReducedMotion } from "@/lib/motion";

interface HeroBannerProps {
  imageUrl?: string;
  headline: string;
  tagline: string;
  subheading: string;
  primaryCta: string;
  secondaryCta: string;
}

export function HeroBanner({
  imageUrl,
  headline,
  tagline,
  subheading,
  primaryCta,
  secondaryCta,
}: HeroBannerProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !sectionRef.current) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapMod, stMod]) => {
      if (cancelled || !sectionRef.current) return;

      const gsap = gsapMod.default;
      gsap.registerPlugin(stMod.ScrollTrigger);

      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: MOTION_EASE.smooth } });

        if (imageRef.current) {
          gsap.set(imageRef.current, { opacity: 0 });
          tl.to(imageRef.current, { opacity: 1, duration: 1, ease: "power2.out" }, 0.1);

          gsap.to(imageRef.current, {
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 1.2,
            },
            y: 60,
            ease: "none",
          });
        }

        tl.fromTo(
          "[data-hero-line]",
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 1, duration: 0.8, transformOrigin: "left center" },
          0.2,
        )
          .from("[data-hero-tagline]", { y: 24, opacity: 0, duration: 0.75 }, 0.35)
          .from("[data-hero-headline]", { y: 32, opacity: 0, duration: 0.8 }, 0.5)
          .from("[data-hero-sub]", { y: 24, opacity: 0, duration: 0.75 }, 0.65)
          .from("[data-hero-cta]", { y: 20, opacity: 0, stagger: 0.12, duration: 0.7 }, 0.8);

        if (contentRef.current) {
          gsap.to(contentRef.current, {
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 1.8,
            },
            y: 48,
            ease: "none",
          });
        }
      }, sectionRef);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="image-frame-dark relative w-full overflow-hidden">
      <div ref={imageRef} className="relative w-full overflow-hidden will-change-transform">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={headline}
            width={1920}
            height={900}
            priority
            className="hero-ken-burns block h-auto w-full"
            sizes="100vw"
          />
        ) : (
          <div className="hero-banner-fallback min-h-[50vh] w-full sm:min-h-[60vh]" />
        )}
      </div>

      {/* Overlays for text readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1a1816]/92 via-[#1a1816]/55 to-[#1a1816]/20" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a1410]/55 via-transparent to-transparent" />
      <div className="hero-vignette-top pointer-events-none absolute inset-x-0 top-0 h-28 sm:h-36" aria-hidden />
      <div className="hero-vignette-bottom pointer-events-none absolute inset-x-0 bottom-0 h-32 sm:h-40" aria-hidden />
      <div className="hero-ambient-glow pointer-events-none absolute inset-0" aria-hidden />
      <div className="hero-banner-shimmer pointer-events-none absolute inset-0 opacity-35" aria-hidden />

      {/* Text on top */}
      <div
        ref={contentRef}
        className="absolute inset-0 container-page flex flex-col justify-center py-12 sm:py-16 lg:py-20"
      >
        <div data-hero-line className="hero-accent-line mb-4 h-px w-16 origin-left sm:w-20" />

        <p
          data-hero-tagline
          className="mb-3 max-w-xl text-xs font-bold uppercase tracking-[0.2em] text-gold/90 sm:mb-4 sm:text-sm"
        >
          {tagline}
        </p>

        <h1
          data-hero-headline
          className="max-w-2xl font-display text-4xl font-semibold leading-[1.12] text-white sm:text-5xl lg:text-6xl"
        >
          {headline}
        </h1>

        <p
          data-hero-sub
          className="mt-4 max-w-lg text-base font-medium leading-relaxed text-white/90 sm:mt-5 sm:text-xl"
        >
          {subheading}
        </p>

        <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:mt-8 sm:max-w-none sm:flex-row sm:gap-3">
          <Link
            data-hero-cta
            href="/shop"
            className="hero-cta-primary inline-flex h-12 w-full items-center justify-center rounded-xl bg-background px-7 text-base font-semibold text-foreground shadow-warm sm:h-14 sm:w-auto sm:rounded-lg sm:px-9"
          >
            {primaryCta}
          </Link>
          <Link
            data-hero-cta
            href="/pages/about"
            className="hero-cta-secondary inline-flex h-12 w-full items-center justify-center rounded-xl px-7 text-base font-semibold text-white backdrop-blur-sm sm:h-14 sm:w-auto sm:rounded-lg sm:px-9"
          >
            {secondaryCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
