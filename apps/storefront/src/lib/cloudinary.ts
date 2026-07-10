const TRANSFORM = "f_auto,q_auto:good,dpr_auto,fl_progressive";

/** Build an optimized Cloudinary delivery URL for OG images, JSON-LD, etc. */
export function optimizeImageUrl(
  src: string | undefined,
  options: { width?: number; height?: number; crop?: string } = {},
): string {
  if (!src) return "";

  const w = options.width ?? 1200;
  const parts = [TRANSFORM, `w_${w}`];
  if (options.height) parts.push(`h_${options.height}`);
  if (options.crop) parts.push(`c_${options.crop}`);
  const transform = parts.join(",");

  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    const [before, after] = src.split("/upload/");
    const rest = after.replace(/^[^/]+\//, ""); // strip existing transforms if any
    const versionMatch = after.match(/^(v\d+\/)/);
    const path = versionMatch ? after : rest;
    return `${before}/upload/${transform}/${path}`;
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (cloudName && !src.startsWith("http")) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${src}`;
  }

  if (src.includes("unsplash.com")) {
    try {
      const url = new URL(src);
      url.searchParams.set("w", String(w));
      url.searchParams.set("auto", "format");
      url.searchParams.set("q", "85");
      return url.toString();
    } catch {
      return src;
    }
  }

  return src;
}

export function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

/** Product schema.org image array for rich results */
export function productImageJsonLd(images: { url: string; alt?: string }[]) {
  return images
    .filter((img) => img.url)
    .map((img) => optimizeImageUrl(img.url, { width: 1200, crop: "limit" }));
}
