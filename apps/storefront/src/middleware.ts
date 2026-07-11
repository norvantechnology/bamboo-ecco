import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getApiUrl, getTenantDomain } from "@/lib/api-config";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { getSiteHost, getSiteUrl } from "@/lib/site";

type RedirectRule = { fromPath: string; toPath: string; statusCode: number };

let cached: RedirectRule[] = [];
let cachedAt = 0;

async function loadRedirects(): Promise<RedirectRule[]> {
  if (cached.length && Date.now() - cachedAt < 5 * 60 * 1000) return cached;
  const api = getApiUrl();
  if (!api) return cached;

  try {
    const res = await fetchWithTimeout(`${api}/storefront/redirects`, {
      headers: { "x-tenant-domain": getTenantDomain() },
      next: { revalidate: 300 },
      timeoutMs: 5_000,
    });
    if (res.ok) {
      cached = (await res.json()) as RedirectRule[];
      cachedAt = Date.now();
    }
  } catch {
    // API unavailable — skip CMS redirects
  }
  return cached;
}

function canonicalizeHostAndSlash(request: NextRequest): NextResponse | null {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") || url.host;
  const siteHost = getSiteHost();
  const apex = siteHost.replace(/^www\./, "");
  const siteUrl = getSiteUrl();
  const wantHttps = siteUrl.startsWith("https://");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  let changed = false;

  // Prefer non-www in production
  if (
    apex &&
    !apex.includes("localhost") &&
    host.toLowerCase().startsWith("www.") &&
    host.toLowerCase().replace(/^www\./, "") === apex.toLowerCase()
  ) {
    url.host = apex;
    changed = true;
  }

  // Enforce HTTPS when the canonical site URL is https (Vercel / proxies)
  if (
    wantHttps &&
    !apex.includes("localhost") &&
    (forwardedProto === "http" || url.protocol === "http:")
  ) {
    url.protocol = "https:";
    if (!url.host || url.host === host) {
      url.host = apex || host.replace(/^www\./i, "");
    }
    changed = true;
  }

  // Strip trailing slash (except root)
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
    changed = true;
  }

  if (!changed) return null;
  return NextResponse.redirect(url, 308);
}

export async function middleware(request: NextRequest) {
  const canonical = canonicalizeHostAndSlash(request);
  if (canonical) return canonical;

  const pathname = request.nextUrl.pathname;
  const redirects = await loadRedirects();
  const rule = redirects.find((r) => r.fromPath === pathname);
  if (rule) {
    return NextResponse.redirect(new URL(rule.toPath, request.url), rule.statusCode);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt|webmanifest)$).*)",
  ],
};
