"use client";

import { useState } from "react";
import Image from "next/image";
import { Box, ImageIcon } from "lucide-react";
import { ProductModelViewer } from "./product-model-viewer";
import type { ProductImage } from "@/lib/api";

interface Props {
  images: ProductImage[];
  title: string;
  model3d?: { glbUrl?: string; usdzUrl?: string; posterUrl?: string };
}

export function ProductGallery({ images, title, model3d }: Props) {
  const [mode, setMode] = useState<"photos" | "3d">("photos");
  const productImages = images.filter((i) => i.type !== "lifestyle");
  const lifestyleImages = images.filter((i) => i.type === "lifestyle");
  const mainImage = productImages[0];
  const has3d = Boolean(model3d?.glbUrl);

  return (
    <div className="space-y-3">
      {has3d && (
        <div className="flex gap-2">
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
        <ProductModelViewer
          model3d={model3d!}
          alt={title}
          fallbackImage={mainImage?.url}
          showToggle={false}
        />
      ) : (
        <>
          <div className="image-frame relative aspect-square overflow-hidden rounded-lg">
            {mainImage && (
              <Image
                src={mainImage.url}
                alt={mainImage.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="image-fit-contain p-2"
              />
            )}
          </div>
          {productImages.length > 1 && (
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4 sm:gap-2">
              {productImages.map((img) => (
                <div
                  key={img.url}
                  className="image-frame relative aspect-square overflow-hidden rounded-md border border-border"
                >
                  <Image src={img.url} alt={img.alt} fill sizes="80px" className="image-fit-contain p-1" />
                </div>
              ))}
            </div>
          )}
          {lifestyleImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-4">
              {lifestyleImages.map((img) => (
                <div key={img.url} className="image-frame relative aspect-[4/3] overflow-hidden rounded-md">
                  <Image src={img.url} alt={img.alt} fill sizes="25vw" className="image-fit-contain p-1" />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
