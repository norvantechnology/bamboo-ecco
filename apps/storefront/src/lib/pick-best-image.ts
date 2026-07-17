import type { ProductImage } from "@/lib/api";

/** Prefer the highest-resolution lifestyle (or product) image for large thumbnails. */
export function pickBestImage(
  images: ProductImage[] | undefined,
  preferType?: "lifestyle" | "product",
): ProductImage | undefined {
  if (!images?.length) return undefined;

  const pool = preferType
    ? images.filter((img) => img.type === preferType)
    : images;
  const candidates = pool.length ? pool : images;

  return [...candidates].sort((a, b) => {
    const areaA = (a.width ?? 0) * (a.height ?? 0);
    const areaB = (b.width ?? 0) * (b.height ?? 0);
    if (areaB !== areaA) return areaB - areaA;
    const lowA = /compressed|600x600|gemini-generated|screenshot/i.test(a.url) ? 1 : 0;
    const lowB = /compressed|600x600|gemini-generated|screenshot/i.test(b.url) ? 1 : 0;
    return lowA - lowB;
  })[0];
}
