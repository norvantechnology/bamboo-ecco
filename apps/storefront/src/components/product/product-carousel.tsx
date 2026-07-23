"use client";

import { useRef, useState, useEffect } from "react";
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

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)));
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [products]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild ? (el.firstElementChild as HTMLElement).offsetWidth + 20 : 300;
    const scrollAmount = direction === "left" ? -cardWidth * 2 : cardWidth * 2;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="relative group/carousel">
      {/* Navigation Arrow Left */}
      <button
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        aria-label="Scroll Left"
        className={`absolute -left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-border/80 bg-surface/90 text-foreground shadow-warm backdrop-blur-md transition-all duration-300 ${
          canScrollLeft
            ? "opacity-90 sm:opacity-0 group-hover/carousel:opacity-100 hover:bg-accent hover:text-white hover:scale-110 hover:shadow-warm-lg"
            : "opacity-0 cursor-not-allowed"
        }`}
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Navigation Arrow Right */}
      <button
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        aria-label="Scroll Right"
        className={`absolute -right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-border/80 bg-surface/90 text-foreground shadow-warm backdrop-blur-md transition-all duration-300 ${
          canScrollRight
            ? "opacity-90 sm:opacity-0 group-hover/carousel:opacity-100 hover:bg-accent hover:text-white hover:scale-110 hover:shadow-warm-lg"
            : "opacity-0 cursor-not-allowed"
        }`}
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory py-3 px-1 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => (
          <div
            key={product._id}
            className="w-[240px] sm:w-[270px] md:w-[290px] lg:w-[310px] shrink-0 snap-start transition-transform duration-300"
          >
            <ProductCard product={product} reveal />
          </div>
        ))}
      </div>

      {/* Progress Track Bar */}
      {products.length > 3 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="h-1.5 w-32 sm:w-48 overflow-hidden rounded-full bg-border/40">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
              style={{ width: `${Math.max(15, scrollProgress)}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
          <span className="text-[11px] font-semibold text-muted tracking-wider uppercase">
            {products.length} Items
          </span>
        </div>
      )}
    </div>
  );
}
