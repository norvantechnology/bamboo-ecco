/**
 * Site identity for SEO — values come from tenant (Admin → SEO / MongoDB).
 * Only NEXT_PUBLIC_SITE_URL stays in env (deployment canonical origin).
 */

import { getLayoutData } from "./layout-data";

export type SiteSeo = {
  name: string;
  description: string;
  defaultTitle: string;
  locale: string;
  themeColor: string;
  backgroundColor: string;
  gscVerification: string;
};

/** Canonical site origin — deployment config only. */
export function getSiteUrl() {
  const url = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim();
  return url.replace(/\/$/, "");
}

export function getSiteHost() {
  try {
    return new URL(getSiteUrl()).host;
  } catch {
    return "localhost:3000";
  }
}

/** Load store SEO from the API (tenant document). Empty strings if unset / offline. */
export async function resolveSiteSeo(): Promise<SiteSeo> {
  const layout = await getLayoutData();
  const seo = layout?.seo;
  return {
    name: layout?.brand?.name?.trim() || "",
    description: seo?.description?.trim() || layout?.brand?.tagline?.trim() || "",
    defaultTitle: seo?.defaultTitle?.trim() || "",
    locale: seo?.locale?.trim() || "en_IN",
    themeColor: seo?.themeColor?.trim() || "",
    backgroundColor: seo?.backgroundColor?.trim() || "",
    gscVerification: seo?.gscVerification?.trim() || "",
  };
}

export const PRIVATE_PATH_PREFIXES = [
  "/account",
  "/cart",
  "/checkout",
  "/login",
  "/register",
  "/forgot-password",
  "/order",
  "/track-order",
  "/search",
  "/api",
];

export const INDEXABLE_STATIC_ROUTES = [
  "/",
  "/shop",
  "/new-arrivals",
  "/best-sellers",
  "/journal",
  "/guides",
] as const;
