"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Box, ChevronLeft, ChevronRight, ImageIcon, Maximize2, X } from "lucide-react";
import { ProductModelViewer } from "./product-model-viewer";
import type { ProductImage } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  images: ProductImage[];
  title: string;
  model3d?: { glbUrl?: string; usdzUrl?: string; posterUrl?: string };
}

export function ProductGallery({ images, title, model3d }: Props) {
  const [mode, setMode] = useState<"photos" | "3d">("photos");
  const [active, setActive] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const thumbRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // All images in one gallery so any tap updates the main banner
  const galleryImages = useMemo(() => {
    return images
      .slice()
      .sort((a, b) => {
        const typeRank = (t?: string) => (t === "lifestyle" ? 1 : 0);
        const byType = typeRank(a.type) - typeRank(b.type);
        if (byType !== 0) return byType;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      });
  }, [images]);

  const imageKey = useMemo(
    () => galleryImages.map((img) => img.url).join("|"),
    [galleryImages],
  );

  const count = galleryImages.length;
  const mainImage = galleryImages[Math.min(active, Math.max(0, count - 1))];
  const has3d = Boolean(model3d?.glbUrl);

  useEffect(() => {
    setActive(0);
  }, [imageKey]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen]);

  const selectImage = useCallback(
    (index: number) => {
      if (count <= 0) return;
      setMode("photos");
      setActive(((index % count) + count) % count);
    },
    [count],
  );

  const go = useCallback(
    (next: number) => {
      if (count <= 1) return;
      setActive(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const el = thumbRef.current?.querySelector<HTMLElement>(`[data-thumb="${active}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  // Handle keyboard navigation for Lightbox & Gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxOpen) {
        if (e.key === "Escape") setLightboxOpen(false);
        if (e.key === "ArrowLeft") go(active - 1);
        if (e.key === "ArrowRight") go(active + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, active, go]);

  // Desktop Mouse Zoom handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  return (
    <div className="min-w-0 w-full max-w-full space-y-3 overflow-hidden">
      {has3d && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("photos")}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
              mode === "photos"
                ? "border-secondary bg-secondary text-white shadow-warm"
                : "border-border hover:bg-background"
            }`}
          >
            <ImageIcon className="icon-brand" />
            Photos
          </button>
          <button
            type="button"
            onClick={() => setMode("3d")}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
              mode === "3d"
                ? "border-secondary bg-secondary text-white shadow-warm"
                : "border-border hover:bg-background"
            }`}
          >
            <Box className="icon-brand" />
            View in 3D
          </button>
        </div>
      )}

      {mode === "3d" && has3d ? (
        <div className="min-w-0 overflow-hidden">
          <ProductModelViewer
            model3d={model3d!}
            alt={title}
            fallbackImage={mainImage?.url}
            showToggle={false}
          />
        </div>
      ) : (
        <>
          <div
            ref={imageContainerRef}
            className="group relative mx-auto w-full max-w-full overflow-hidden rounded-xl bg-[#f0ebe3] touch-pan-y cursor-zoom-in"
            style={{
              width: "min(100%, 70vh, 560px)",
              aspectRatio: "1 / 1",
            }}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
            onTouchStart={(e) => {
              touchStartX.current = e.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              const start = touchStartX.current;
              const end = e.changedTouches[0]?.clientX;
              touchStartX.current = null;
              if (start == null || end == null || count <= 1) return;
              const dx = end - start;
              if (Math.abs(dx) < 40) return;
              go(active + (dx < 0 ? 1 : -1));
            }}
            onClick={() => mainImage && setLightboxOpen(true)}
          >
            {mainImage ? (
              <>
                <Image
                  key={mainImage.url}
                  src={mainImage.url}
                  alt={mainImage.alt || title}
                  fill
                  priority={active === 0}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 560px"
                  quality={85}
                  className={cn(
                    "object-contain object-center p-3 transition-opacity duration-200 sm:p-5",
                    isZoomed ? "opacity-0 sm:opacity-0" : "opacity-100"
                  )}
                />

                {/* Desktop Zoom-on-Hover View */}
                {isZoomed && (
                  <div
                    className="pointer-events-none absolute inset-0 hidden sm:block rounded-xl bg-no-repeat transition-all duration-75"
                    style={{
                      backgroundImage: `url('${mainImage.url}')`,
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundSize: "220%",
                    }}
                  />
                )}
              </>
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted">
                No image
              </div>
            )}

            {/* Expand / Lightbox Trigger Button */}
            {mainImage && (
              <button
                type="button"
                aria-label="Expand image"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxOpen(true);
                }}
                className="absolute right-2.5 top-2.5 z-[3] flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-surface/90 text-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 sm:h-9 sm:w-9"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}

            {count > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(active - 1);
                  }}
                  className="absolute left-2 top-1/2 z-[2] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-surface/95 text-foreground shadow-warm backdrop-blur-sm transition hover:bg-surface sm:h-10 sm:w-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(active + 1);
                  }}
                  className="absolute right-2 top-1/2 z-[2] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-surface/95 text-foreground shadow-warm backdrop-blur-sm transition hover:bg-surface sm:h-10 sm:w-10"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-2.5 right-2.5 z-[2] rounded-full bg-foreground/75 px-2.5 py-1 text-xs font-medium text-background backdrop-blur-sm">
                  {active + 1} / {count}
                </span>
              </>
            )}
          </div>

          {count > 1 && (
            <div
              ref={thumbRef}
              className="flex max-w-full gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="list"
              aria-label="Product images"
            >
              {galleryImages.map((img, index) => (
                <button
                  key={`${img.url}-${index}`}
                  type="button"
                  data-thumb={index}
                  role="listitem"
                  aria-label={`Show image ${index + 1}`}
                  aria-current={index === active}
                  onClick={() => selectImage(index)}
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-[#f0ebe3] transition active:scale-95 sm:h-[4.5rem] sm:w-[4.5rem]",
                    index === active
                      ? "border-secondary shadow-warm ring-2 ring-secondary/30"
                      : "border-border opacity-80 hover:opacity-100",
                  )}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    sizes="72px"
                    className="pointer-events-none object-contain object-center p-1"
                  />
                  {img.type === "lifestyle" && (
                    <span className="absolute bottom-0.5 right-0.5 rounded bg-foreground/70 px-1 py-0.2 text-[9px] font-semibold text-white">
                      Life
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Lightbox / Fullscreen Modal */}
      {lightboxOpen && mainImage && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 p-4 backdrop-blur-md"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div className="flex w-full items-center justify-between text-white sm:px-4">
            <span className="text-sm font-medium">
              {title} ({active + 1} of {count})
            </span>
            <button
              type="button"
              aria-label="Close modal"
              onClick={() => setLightboxOpen(false)}
              className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Main Fullscreen Image Container */}
          <div
            className="relative flex h-[75vh] w-full max-w-5xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={mainImage.url}
              alt={mainImage.alt || title}
              fill
              sizes="100vw"
              className="object-contain object-center"
              quality={100}
              priority
            />

            {count > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() => go(active - 1)}
                  className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:left-4"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => go(active + 1)}
                  className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:right-4"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {count > 1 && (
            <div
              className="flex max-w-full gap-2 overflow-x-auto pb-2 scrollbar-none"
              onClick={(e) => e.stopPropagation()}
            >
              {galleryImages.map((img, index) => (
                <button
                  key={`lightbox-${img.url}-${index}`}
                  type="button"
                  onClick={() => selectImage(index)}
                  className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 bg-[#f0ebe3] transition",
                    index === active ? "border-gold ring-2 ring-gold/40" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <Image src={img.url} alt="" fill sizes="56px" className="object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
