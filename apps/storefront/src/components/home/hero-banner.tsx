"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MOTION_EASE, prefersReducedMotion } from "@/lib/motion";

interface HeroBannerProps {
  imageUrl?: string;
  mobileImageUrl?: string;
  imageUrls?: string[];
  mobileImageUrls?: string[];
  headline: string;
  tagline: string;
  subheading: string;
  primaryCta: string;
  secondaryCta: string;
}

function resolveList(primary?: string[], legacy?: string): string[] {
  const fromArr = (primary ?? []).map((u) => u.trim()).filter(Boolean);
  if (fromArr.length) return fromArr;
  const single = legacy?.trim();
  return single ? [single] : [];
}

function HeroSlides({
  images,
  alt,
  className,
  width,
  height,
}: {
  images: string[];
  alt: string;
  className: string;
  width: number;
  height: number;
}) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [images.join("|")]);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [images]);

  if (!images.length) return null;

  return (
    <div
      className="absolute inset-0"
      onTouchStart={(e) => {
        touchStartX.current = e.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        const end = e.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (start == null || end == null || images.length <= 1) return;
        const dx = end - start;
        if (Math.abs(dx) < 40) return;
        setIndex((i) =>
          dx < 0 ? (i + 1) % images.length : (i - 1 + images.length) % images.length,
        );
      }}
    >
      {images.map((src, i) => (
        <Image
          key={`${src}-${i}`}
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={i === 0}
          sizes="100vw"
          className={`${className} transition-opacity duration-700 ease-out ${
            i === index ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />
      ))}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-[2] flex -translate-x-1/2 gap-1.5 sm:bottom-5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show banner ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function HeroBanner({
  imageUrl,
  mobileImageUrl,
  imageUrls,
  mobileImageUrls,
  headline,
  tagline,
  subheading,
  primaryCta,
  secondaryCta,
}: HeroBannerProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const desktopImages = useMemo(
    () => resolveList(imageUrls, imageUrl),
    [imageUrls, imageUrl],
  );
  const mobileImages = useMemo(() => {
    const mobile = resolveList(mobileImageUrls, mobileImageUrl);
    return mobile.length ? mobile : desktopImages;
  }, [mobileImageUrls, mobileImageUrl, desktopImages]);

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

  const hasImages = desktopImages.length > 0 || mobileImages.length > 0;

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden
        h-[min(62dvh,24rem)] min-h-[18rem]
        sm:h-auto sm:min-h-0"
    >
      <div ref={imageRef} className="absolute inset-0 will-change-transform sm:relative sm:inset-auto">
        {hasImages ? (
          <>
            <div className="absolute inset-0 sm:hidden">
              <HeroSlides
                images={mobileImages}
                alt={headline}
                width={1080}
                height={1350}
                className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
              />
            </div>
            <div className="relative hidden w-full sm:block sm:aspect-[2.2/1] sm:min-h-[42vh]">
              <HeroSlides
                images={desktopImages.length ? desktopImages : mobileImages}
                alt={headline}
                width={1920}
                height={900}
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            </div>
          </>
        ) : (
          <div className="hero-banner-fallback absolute inset-0 h-full w-full sm:static sm:min-h-[42vh] sm:h-auto" />
        )}
      </div>

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
              className="mb-1.5 line-clamp-2 max-w-[20rem] text-[10px] font-semibold uppercase leading-snug tracking-[0.12em] text-gold drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] sm:mb-4 sm:max-w-xl sm:text-sm sm:font-bold sm:tracking-[0.2em]"
            >
              {tagline}
            </p>
          ) : null}

          <h1
            data-hero-headline
            className="max-w-[16rem] break-words font-display text-[1.5rem] font-semibold leading-[1.12] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] sm:max-w-2xl sm:text-4xl sm:leading-[1.12] lg:text-5xl"
          >
            {headline}
          </h1>

          {subheading ? (
            <p
              data-hero-sub
              className="mt-2 line-clamp-2 max-w-[18rem] break-words text-[13px] font-medium leading-snug text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)] sm:mt-4 sm:max-w-lg sm:text-lg sm:leading-relaxed"
            >
              {subheading}
            </p>
          ) : null}

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
