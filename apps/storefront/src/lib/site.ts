/** Central site identity for SEO, sitemaps, and AI discovery files */
export const SITE_NAME = "Terra Living";

export const SITE_DESCRIPTION =
  "Shop handcrafted bamboo furniture and eco-friendly home decor online in India. Sustainable, space-saving designs for modern Indian homes.";

export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return url.replace(/\/$/, "");
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
