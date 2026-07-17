/**
 * Next.js custom image loader — Cloudinary SEO + performance transforms.
 * Falls back to Unsplash/legacy URLs during migration.
 */

const TRANSFORM_BASE = "f_auto,dpr_auto,fl_progressive";

function qualityForWidth(width: number): string {
  // Sharper delivery for large section thumbnails
  if (width >= 900) return "q_auto:best";
  if (width >= 600) return "q_auto:good";
  return "q_auto";
}

/** Return public_id path after /upload/, stripping any prior transform segment. */
function cloudinaryAssetPath(afterUpload: string): string {
  const parts = afterUpload.split("/");
  // Transform segment contains commas and is not a version folder
  if (parts[0] && parts[0].includes(",") && !parts[0].startsWith("v")) {
    return parts.slice(1).join("/");
  }
  return afterUpload;
}

function injectTransforms(url: string, width: number): string {
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const prefix = url.slice(0, idx + marker.length);
  const assetPath = cloudinaryAssetPath(url.slice(idx + marker.length));
  const transforms = `${TRANSFORM_BASE},${qualityForWidth(width)},w_${width},c_limit`;
  return `${prefix}${transforms}/${assetPath}`;
}

function optimizeUnsplash(url: string, width: number): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("w", String(width));
    parsed.searchParams.set("q", "85");
    parsed.searchParams.set("auto", "format");
    parsed.searchParams.set("fit", "crop");
    return parsed.toString();
  } catch {
    return url;
  }
}

function applyGenericWidth(url: string, width: number): string {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.has("width")) {
      parsed.searchParams.set("width", String(width));
      return parsed.toString();
    }
    if (parsed.searchParams.has("w")) {
      parsed.searchParams.set("w", String(width));
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

export default function cloudinaryLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src) return src;

  if (src.includes("res.cloudinary.com")) {
    return injectTransforms(src, width);
  }

  if (src.startsWith("/") || src.startsWith("data:")) {
    return src;
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (cloudName && !src.startsWith("http")) {
    const transforms = `${TRANSFORM_BASE},${qualityForWidth(width)},w_${width},c_limit`;
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${src}`;
  }

  if (src.includes("images.unsplash.com") || src.includes("unsplash.com")) {
    return optimizeUnsplash(src, width);
  }

  if (src.startsWith("http")) {
    return applyGenericWidth(src, width);
  }

  return src;
}
