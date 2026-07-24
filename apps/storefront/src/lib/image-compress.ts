/**
 * Image compression and optimization utility for Bamboo Eco-Hub.
 * Applies automatic WebP/AVIF format selection (f_auto) and AI quality compression (q_auto).
 */

export function getCompressedImageUrl(
  url: string | undefined | null,
  width?: number,
  quality: "q_auto" | "q_auto:good" | "q_auto:best" | "q_auto:eco" = "q_auto"
): string {
  if (!url) return "";

  // 1. Cloudinary URLs
  if (url.includes("res.cloudinary.com")) {
    const marker = "/upload/";
    const idx = url.indexOf(marker);
    if (idx === -1) return url;

    const prefix = url.slice(0, idx + marker.length);
    let rest = url.slice(idx + marker.length);

    // Strip any existing transformation segment prior to version (v12345) or asset path
    rest = rest.replace(/^(?:[a-z0-9_-]+,[^/]+\/)+/i, "");
    rest = rest.replace(/^(?:[a-z]_[^/]+,)*[a-z]_[^/]+\//i, "");

    const transformParts = ["f_auto", quality, "fl_progressive"];
    if (width && width > 0) {
      transformParts.push(`w_${width}`, "c_limit");
    }

    return `${prefix}${transformParts.join(",")}/${rest}`;
  }

  // 2. Unsplash URLs
  if (url.includes("images.unsplash.com") || url.includes("unsplash.com")) {
    try {
      const parsed = new URL(url);
      if (width) parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", "80");
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      return parsed.toString();
    } catch {
      return url;
    }
  }

  return url;
}
