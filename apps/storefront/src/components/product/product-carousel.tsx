"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./product-card";
import type { Product } from "@/lib/api";

interface ProductCarouselProps {
  products: Product[];
}

export function ProductCarousel({ products }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const rafIdRef = useRef<number | null>(null);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    
    const nextLeft = scrollLeft > 5;
    const nextRight = scrollLeft < scrollWidth - clientWidth - 10;
    const maxScroll = scrollWidth - clientWidth;
    const nextProgress = maxScroll > 0 ? Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)) : 0;

    setCanScrollLeft((prev) => (prev !== nextLeft ? nextLeft : prev));
    setCanScrollRight((prev) => (prev !== nextRight ? nextRight : prev));
    setScrollProgress((prev) => (Math.abs(prev - nextProgress) > 0.5 ? nextProgress : prev));
  }, []);

  const handleScroll = useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      updateScrollState();
      rafIdRef.current = null;
    });
  }, [updateScrollState]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll, updateScrollState, products]);

  const scrollBy = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 20 : 320;
    const scrollAmount = direction === "left" ? -cardWidth * 2 : cardWidth * 2;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (!products || products.length === 0) return null;

  // Mobile slice: 12 products (2 per row x 6 rows)
  const mobileProducts = products.slice(0, 12);

  return (
    <div className="relative w-full">
      {/* 📱 MOBILE VIEW: 2-column grid showing 12 products */}
      <div className="grid grid-cols-2 gap-2.5 sm:hidden">
        {mobileProducts.map((product) => (
          <ProductCard key={product._id} product={product} reveal={false} />
        ))}
      </div>

      {/* 💻 DESKTOP / TABLET VIEW: Hardware-Accelerated Smooth CSS Carousel Slider */}
      <div className="hidden sm:block overflow-x-clip">
        {/* Top Header Navigation Controls */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted tracking-wider uppercase">
            {products.length} Products Available
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollBy("left")}
              disabled={!canScrollLeft}
              aria-label="Previous products"
              className={`flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-sm transition-all duration-200 ${
                canScrollLeft
                  ? "hover:bg-gold hover:text-white hover:border-gold hover:scale-105 active:scale-95 cursor-pointer"
                  : "opacity-30 cursor-not-allowed"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollBy("right")}
              disabled={!canScrollRight}
              aria-label="Next products"
              className={`flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-sm transition-all duration-200 ${
                canScrollRight
                  ? "hover:bg-gold hover:text-white hover:border-gold hover:scale-105 active:scale-95 cursor-pointer"
                  : "opacity-30 cursor-not-allowed"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Floating Side Arrows */}
        <button
          onClick={() => scrollBy("left")}
          disabled={!canScrollLeft}
          aria-label="Scroll Left"
          className={`absolute -left-4 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-surface/95 text-foreground shadow-lg backdrop-blur-md transition-all duration-200 ${
            canScrollLeft
              ? "hover:bg-gold hover:text-white hover:scale-110 active:scale-95 cursor-pointer"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={() => scrollBy("right")}
          disabled={!canScrollRight}
          aria-label="Scroll Right"
          className={`absolute -right-4 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-surface/95 text-foreground shadow-lg backdrop-blur-md transition-all duration-200 ${
            canScrollRight
              ? "hover:bg-gold hover:text-white hover:scale-110 active:scale-95 cursor-pointer"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Hardware-Accelerated Smooth Carousel Track */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth py-2 px-1"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {products.map((product, index) => (
            <div
              key={product._id}
              className="w-[240px] sm:w-[270px] md:w-[290px] lg:w-[310px] shrink-0 snap-start"
            >
              <ProductCard product={product} reveal={false} priorityImage={index < 4} />
            </div>
          ))}
        </div>

        {/* Smooth Progress Indicator Bar */}
        {products.length > 3 && (
          <div className="mt-3 flex items-center justify-center">
            <div className="h-1.5 w-40 sm:w-56 overflow-hidden rounded-full bg-border/40">
              <motion.div
                className="h-full bg-gradient-to-r from-gold to-accent rounded-full"
                style={{ width: `${Math.max(15, scrollProgress)}%` }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
