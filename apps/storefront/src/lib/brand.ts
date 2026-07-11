/** Canonical brand asset paths (served from /public/brand). */
export const BRAND_ASSETS = {
  icon: "/brand/icon.svg",
} as const;

export function brandAssetUrl(path: keyof typeof BRAND_ASSETS, siteUrl: string) {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${BRAND_ASSETS[path]}`;
}
