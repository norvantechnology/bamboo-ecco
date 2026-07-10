/**
 * Next.js custom image loader — Cloudinary SEO + performance transforms.
 * Falls back to Unsplash/legacy URLs during migration.
 */

const TRANSFORM = "f_auto,q_auto:good,dpr_auto,fl_progressive";

function injectTransforms(url: string, width: number): string {
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const prefix = url.slice(0, idx + marker.length);
  const rest = url.slice(idx + marker.length);

  // Already has transformation segment (not version v123/)
  if (rest.includes(",") && !rest.startsWith("v")) {
    return url;
  }

  const transforms = `${TRANSFORM},w_${width}`;
  return `${prefix}${transforms}/${rest}`;
}

function optimizeUnsplash(url: string, width: number): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("w", String(width));
    parsed.searchParams.set("q", "80");
    parsed.searchParams.set("auto", "format");
    parsed.searchParams.set("fit", "crop");
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Generic width handling for external CDNs (e.g. Shopify `?width=`).
 * Ensures the loader varies output by width so Next.js doesn't warn.
 */
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

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (cloudName && !src.startsWith("http")) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${TRANSFORM},w_${width}/${src}`;
  }

  if (src.includes("images.unsplash.com") || src.includes("unsplash.com")) {
    return optimizeUnsplash(src, width);
  }

  if (src.startsWith("http")) {
    return applyGenericWidth(src, width);
  }

  return src;
}
