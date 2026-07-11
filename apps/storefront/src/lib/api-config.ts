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

/** API base URL for server fetches. Skips unreachable localhost during CI/production builds. */
export function getApiUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim() || LOCAL_API;
  if (isLocalApiUrl(url) && isProductionBuild()) return null;
  return url;
}

/** API URL for client/runtime calls (checkout, auth). */
export function getRuntimeApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.trim() || LOCAL_API;
}

/**
 * Tenant hostname sent as `x-tenant-domain`.
 * Prefer NEXT_PUBLIC_TENANT_DOMAIN so Vercel/custom domains can map to the
 * domain stored on the tenant document (often "localhost" after seeding).
 */
export function getTenantDomain(): string {
  const fromEnv = process.env.NEXT_PUBLIC_TENANT_DOMAIN?.trim();
  if (fromEnv) return fromEnv.replace(/^www\./, "").toLowerCase();
  if (typeof window !== "undefined" && window.location?.hostname) {
    return window.location.hostname.replace(/^www\./, "").toLowerCase();
  }
  return "localhost";
}
