"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";


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
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const imagesKey = images.join("|");

  useEffect(() => {
    setIndex(0);
  }, [imagesKey]);

  useEffect(() => {
    if (images.length <= 1 || isPaused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [images, isPaused]);

  if (!images.length) return null;

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => {
        setIsPaused(true);
        touchStartX.current = e.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        setIsPaused(false);
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
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={images[index]}
            alt={alt}
            width={width}
            height={height}
            priority
            sizes="100vw"
            className={`${className} animate-hero-zoom`}
          />
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-[3] flex -translate-x-1/2 gap-2 sm:bottom-6">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show banner ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-[#C9A24B] shadow-sm" : "w-2 bg-white/50 hover:bg-white"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

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
  const desktopImages = useMemo(
    () => resolveList(imageUrls, imageUrl),
    [imageUrls, imageUrl],
  );
  const mobileImages = useMemo(() => {
    const mobile = resolveList(mobileImageUrls, mobileImageUrl);
    return mobile.length ? mobile : desktopImages;
  }, [mobileImageUrls, mobileImageUrl, desktopImages]);

  const hasImages = desktopImages.length > 0 || mobileImages.length > 0;

  return (
    <section
      className="relative w-full overflow-hidden
        h-[70dvh] min-h-[26rem]
        sm:h-auto sm:aspect-[2.2/1] sm:min-h-[42vh]"
    >
      <div className="absolute inset-0">
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

      {/* Dark gradient overlay for text readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/85 via-black/40 to-transparent sm:bg-gradient-to-tr sm:from-black/80 sm:via-black/30 sm:to-transparent" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="absolute inset-0 z-[2] flex flex-col justify-end
          px-5 pb-10 pt-10
          sm:justify-center sm:px-8 sm:pb-16 sm:pt-16 lg:py-20"
      >
        <div className="container-page w-full min-w-0">
          {tagline ? (
            <motion.p
              variants={itemVariants}
              className="mb-3 inline-block w-fit rounded-full border border-gold/45 bg-[#c9a24b]/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[#faf8f5] backdrop-blur-sm sm:mb-4 sm:text-xs"
            >
              {tagline}
            </motion.p>
          ) : null}

          <motion.h1
            variants={itemVariants}
            className="mb-3 max-w-[20rem] font-display text-3xl font-semibold leading-[1.12] text-white drop-shadow-md sm:mb-4 sm:max-w-2xl sm:text-5xl lg:text-6xl"
          >
            {headline}
          </motion.h1>

          {subheading ? (
            <motion.p
              variants={itemVariants}
              className="mb-6 max-w-[20rem] text-sm font-medium leading-relaxed text-white/95 drop-shadow-sm sm:max-w-xl sm:text-base lg:text-lg"
            >
              {subheading}
            </motion.p>
          ) : null}

          <motion.div
            variants={itemVariants}
            className="flex w-full flex-col gap-3 sm:max-w-none sm:flex-row sm:gap-4"
          >
            <Link
              href="/shop"
              className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#4A5D3E] px-6 text-sm font-semibold text-white shadow-warm transition-all duration-200 hover:bg-[#3D4D33] active:scale-[0.96] sm:h-14 sm:w-auto sm:px-9 sm:text-base"
            >
              {primaryCta}
            </Link>
            <Link
              href="/pages/about"
              className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-white/35 bg-white/10 px-6 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 active:scale-[0.96] sm:h-14 sm:w-auto sm:px-9 sm:text-base"
            >
              {secondaryCta}
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
