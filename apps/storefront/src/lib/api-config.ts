/**
 * API connection helpers (not SEO identity).
 *
 * SEO URL / brand / robots / canonicals → `@/lib/site` + `@/lib/seo`
 * Dynamic SEO *content* (sitemap products, product metadata, JSON-LD data)
 * loads through `@/lib/api`, which calls `getApiUrl()` + `getTenantDomain()` here.
 *
 * Live (Vercel): set NEXT_PUBLIC_API_URL to the Railway HTTPS API.
 * Local: falls back to http://localhost:4000.
 */

const LOCAL_API = "http://localhost:4000";

function isProductionBuild(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.CI === "true"
  );
}

function isLocalApiUrl(url: string): boolean {
  return (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.startsWith("http://0.0.0.0")
  );
}

/**
 * Server-side API base (RSC, sitemap, generateMetadata, layout).
 * Returns null during CI/production build if the URL is still localhost
 * so Next can finish building without a running API (sitemap then uses
 * static routes only until the live API URL is set).
 */
export function getApiUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim() || LOCAL_API;
  if (isLocalApiUrl(url) && isProductionBuild()) return null;
  return url;
}

/** Browser / client runtime API (checkout, auth, cart). Always returns a URL. */
export function getRuntimeApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.trim() || LOCAL_API;
}

/**
 * Value sent as `x-tenant-domain` so the API picks the right store in MongoDB.
 * Prefer NEXT_PUBLIC_TENANT_DOMAIN (often "localhost" after seeding) so Vercel
 * hostnames still map to the same tenant document.
 */
export function getTenantDomain(): string {
  const fromEnv = process.env.NEXT_PUBLIC_TENANT_DOMAIN?.trim();
  if (fromEnv) return fromEnv.replace(/^www\./, "").toLowerCase();
  if (typeof window !== "undefined" && window.location?.hostname) {
    return window.location.hostname.replace(/^www\./, "").toLowerCase();
  }
  return "localhost";
}
