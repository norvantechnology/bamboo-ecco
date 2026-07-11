/**
 * Site identity for SEO.
 * Dynamic values come from tenant.seo via /storefront/layout (admin → SEO page).
 * NEXT_PUBLIC_SITE_URL stays in env (deployment URL). Other SEO keys are DB-only.
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

/** Used only when the API is unreachable (build / offline). */
export const SITE_SEO_FALLBACK: SiteSeo = {
  name: "Terra Living",
  description:
    "Shop handcrafted bamboo furniture and eco-friendly home decor online in India. Sustainable, space-saving designs for modern Indian homes.",
  defaultTitle: "Bamboo Furniture & Home Decor",
  locale: "en_IN",
  themeColor: "#4B3621",
  backgroundColor: "#FAF8F3",
  gscVerification: "",
};

/** Canonical site origin — deployment config only (not editable in admin). */
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

/** Resolve store SEO from DB (via layout API). Falls back when API is down. */
export async function resolveSiteSeo(): Promise<SiteSeo> {
  const layout = await getLayoutData();
  if (!layout) return SITE_SEO_FALLBACK;

  const seo = layout.seo;
  return {
    name: layout.brand?.name?.trim() || SITE_SEO_FALLBACK.name,
    description: seo?.description?.trim() || layout.brand?.tagline?.trim() || SITE_SEO_FALLBACK.description,
    defaultTitle: seo?.defaultTitle?.trim() || SITE_SEO_FALLBACK.defaultTitle,
    locale: seo?.locale?.trim() || SITE_SEO_FALLBACK.locale,
    themeColor: seo?.themeColor?.trim() || SITE_SEO_FALLBACK.themeColor,
    backgroundColor: seo?.backgroundColor?.trim() || SITE_SEO_FALLBACK.backgroundColor,
    gscVerification: seo?.gscVerification?.trim() || "",
  };
}

/** Sync fallbacks for client components / rare sync call sites. Prefer resolveSiteSeo(). */
export function getSiteName() {
  return SITE_SEO_FALLBACK.name;
}
export function getSiteDescription() {
  return SITE_SEO_FALLBACK.description;
}
export function getSiteDefaultTitle() {
  return SITE_SEO_FALLBACK.defaultTitle;
}
export function getSiteLocale() {
  return SITE_SEO_FALLBACK.locale;
}
export function getThemeColor() {
  return SITE_SEO_FALLBACK.themeColor;
}
export function getBackgroundColor() {
  return SITE_SEO_FALLBACK.backgroundColor;
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
