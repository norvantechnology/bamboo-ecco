"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Box, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
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
  const productImages = images
    .filter((i) => i.type !== "lifestyle")
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const lifestyleImages = images.filter((i) => i.type === "lifestyle");
  const [active, setActive] = useState(0);
  const thumbRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const count = productImages.length;
  const mainImage = productImages[Math.min(active, Math.max(0, count - 1))];
  const has3d = Boolean(model3d?.glbUrl);

  useEffect(() => {
    setActive(0);
  }, [images]);

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
          {/*
            Fixed square stage + max-height keeps any aspect ratio / huge source
            images from blowing out the mobile layout. object-contain shows the
            full product without cropping.
          */}
          <div
            className="relative mx-auto w-full max-w-full overflow-hidden rounded-xl bg-[#f0ebe3] touch-pan-y"
            style={{
              width: "min(100%, 70vh, 560px)",
              aspectRatio: "1 / 1",
            }}
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
          >
            {mainImage ? (
              <Image
                key={mainImage.url}
                src={mainImage.url}
                alt={mainImage.alt || title}
                fill
                priority={active === 0}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 560px"
                quality={90}
                className="object-contain object-center p-3 sm:p-5"
              />
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted">
                No image
              </div>
            )}

            {count > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() => go(active - 1)}
                  className="absolute left-2 top-1/2 z-[2] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-surface/95 text-foreground shadow-warm backdrop-blur-sm transition hover:bg-surface sm:h-10 sm:w-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => go(active + 1)}
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
              {productImages.map((img, index) => (
                <button
                  key={`${img.url}-${index}`}
                  type="button"
                  data-thumb={index}
                  role="listitem"
                  aria-label={`Show image ${index + 1}`}
                  aria-current={index === active}
                  onClick={() => setActive(index)}
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-[#f0ebe3] transition sm:h-[4.5rem] sm:w-[4.5rem]",
                    index === active
                      ? "border-secondary shadow-warm"
                      : "border-border opacity-80 hover:opacity-100",
                  )}
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    sizes="72px"
                    className="object-contain object-center p-1"
                  />
                </button>
              ))}
            </div>
          )}

          {lifestyleImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-2 sm:gap-3 sm:pt-4">
              {lifestyleImages.map((img, i) => (
                <div
                  key={`${img.url}-life-${i}`}
                  className="relative aspect-[3/4] min-w-0 overflow-hidden rounded-lg bg-[#f0ebe3]"
                >
                  <Image
                    src={img.url}
                    alt={img.alt || `${title} lifestyle`}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    quality={85}
                    className="object-contain object-center p-1.5 sm:p-2"
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
