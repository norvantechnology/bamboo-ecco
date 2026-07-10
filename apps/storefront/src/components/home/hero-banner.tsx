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
      const isMobile = window.matchMedia("(max-width: 640px)").matches;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: MOTION_EASE.smooth } });

        if (imageRef.current) {
          gsap.set(imageRef.current, { opacity: 0 });
          tl.to(imageRef.current, { opacity: 1, duration: 0.9, ease: "power2.out" }, 0);

          if (!isMobile) {
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
        }

        if (!isMobile) {
          tl.from("[data-hero-tagline]", { y: 16, opacity: 0, duration: 0.6 }, 0.25)
            .from("[data-hero-headline]", { y: 20, opacity: 0, duration: 0.65 }, 0.4)
            .from("[data-hero-sub]", { y: 16, opacity: 0, duration: 0.6 }, 0.5)
            .from("[data-hero-cta]", { y: 12, opacity: 0, stagger: 0.1, duration: 0.55 }, 0.6);

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
        }
      }, sectionRef);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="image-frame-dark relative w-full overflow-hidden
        /* Mobile: fit first screen without cutting CTAs under cart bar */
        h-[min(70dvh,28rem)] min-h-[22rem]
        sm:h-auto sm:min-h-0"
    >
      <div ref={imageRef} className="absolute inset-0 will-change-transform sm:relative sm:inset-auto">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={headline}
            width={1920}
            height={900}
            priority
            className="hero-ken-burns absolute inset-0 h-full w-full object-cover object-[center_35%] sm:static sm:block sm:h-auto sm:w-full sm:object-center"
            sizes="100vw"
          />
        ) : (
          <div className="hero-banner-fallback absolute inset-0 h-full w-full sm:static sm:min-h-[50vh] sm:h-auto" />
        )}
      </div>

      {/* Stronger bottom gradient on mobile for text + CTA readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a1410] via-[#1a1410]/55 to-[#1a1410]/25 sm:via-[#1a1410]/20 sm:to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1a1816]/90 via-[#1a1816]/45 to-transparent sm:via-[#1a1816]/55" />
      <div className="hero-vignette-top pointer-events-none absolute inset-x-0 top-0 h-16 sm:h-36" aria-hidden />
      <div className="hero-ambient-glow pointer-events-none absolute inset-0 hidden sm:block" aria-hidden />
      <div className="hero-banner-shimmer pointer-events-none absolute inset-0 opacity-25 sm:opacity-35" aria-hidden />

      <div
        ref={contentRef}
        className="absolute inset-0 z-[1] flex flex-col justify-end
          pb-5 pt-10
          sm:justify-center sm:pb-16 sm:pt-16 lg:py-20"
      >
        <div className="container-page w-full min-w-0">
          {tagline ? (
            <p
              data-hero-tagline
              className="mb-1.5 line-clamp-2 max-w-[20rem] text-[10px] font-semibold uppercase leading-snug tracking-[0.12em] text-gold/90 sm:mb-4 sm:max-w-xl sm:text-sm sm:font-bold sm:tracking-[0.2em]"
            >
              {tagline}
            </p>
          ) : null}

          <h1
            data-hero-headline
            className="max-w-[16rem] break-words font-display text-[1.65rem] font-semibold leading-[1.12] text-white sm:max-w-2xl sm:text-5xl sm:leading-[1.12] lg:text-6xl"
          >
            {headline}
          </h1>

          {subheading ? (
            <p
              data-hero-sub
              className="mt-2 line-clamp-2 max-w-[18rem] break-words text-[13px] font-medium leading-snug text-white/88 sm:mt-5 sm:max-w-lg sm:text-xl sm:leading-relaxed"
            >
              {subheading}
            </p>
          ) : null}

          {/* Full-width stacked CTAs on mobile so labels aren't truncated */}
          <div className="mt-3.5 flex w-full flex-col gap-2 sm:mt-8 sm:max-w-none sm:flex-row sm:gap-3">
            <Link
              data-hero-cta
              href="/shop"
              className="hero-cta-primary inline-flex h-10 w-full items-center justify-center rounded-lg bg-background px-4 text-[13px] font-semibold text-foreground shadow-warm sm:h-14 sm:w-auto sm:px-9 sm:text-base"
            >
              {primaryCta}
            </Link>
            <Link
              data-hero-cta
              href="/pages/about"
              className="hero-cta-secondary inline-flex h-10 w-full items-center justify-center rounded-lg px-4 text-[13px] font-semibold text-white backdrop-blur-sm sm:h-14 sm:w-auto sm:px-9 sm:text-base"
            >
              {secondaryCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
