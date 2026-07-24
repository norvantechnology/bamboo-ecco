/**
 * Next.js custom image loader — Cloudinary SEO + automatic WebP/AVIF compression.
 */
import { getCompressedImageUrl } from "./image-compress";

export default function cloudinaryLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src) return src;

  if (src.startsWith("/") || src.startsWith("data:")) {
    return src;
  }

  const qualityPreset = width >= 900 ? "q_auto:good" : "q_auto";

  if (src.includes("res.cloudinary.com")) {
    return getCompressedImageUrl(src, width, qualityPreset);
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (cloudName && !src.startsWith("http")) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,${qualityPreset},fl_progressive,w_${width},c_limit/${src}`;
  }

  return src;
}
