import type { ProductImage } from "@/lib/api";

/** Filenames / paths that usually mean compressed, AI, or text-heavy creatives. */
function looksLikeLowQualityOrTextHeavy(url: string): boolean {
  return /compressed|600x600|gemini-generated|screenshot|scene-ad-campaign|meta-ad-creative|untitled-design/i.test(
    url,
  );
}

function imageScore(img: ProductImage): number {
  const area = (img.width ?? 0) * (img.height ?? 0);
  const penalty = looksLikeLowQualityOrTextHeavy(img.url) ? 1e12 : 0;
  return area - penalty;
}

/** Prefer the highest-resolution clean photo (no text-heavy creatives). */
export function pickBestImage(
  images: ProductImage[] | undefined,
  preferType?: "lifestyle" | "product",
): ProductImage | undefined {
  if (!images?.length) return undefined;

  const pool = preferType
    ? images.filter((img) => img.type === preferType)
    : images;
  let candidates = pool.length ? pool : images;

  // Prefer clean photos when available
  const clean = candidates.filter((img) => !looksLikeLowQualityOrTextHeavy(img.url));
  if (clean.length) candidates = clean;

  return [...candidates].sort((a, b) => imageScore(b) - imageScore(a))[0];
}

/** Best product thumbnail: clean high-res product shot (not lifestyle overlay creatives). */
export function pickThumbnailImage(images: ProductImage[] | undefined): ProductImage | undefined {
  const product = pickBestImage(images, "product");
  if (product) return product;
  return pickBestImage(images);
}
