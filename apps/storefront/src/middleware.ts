import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getApiUrl } from "@/lib/api-config";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

type RedirectRule = { fromPath: string; toPath: string; statusCode: number };

let cached: RedirectRule[] = [];
let cachedAt = 0;

async function loadRedirects(): Promise<RedirectRule[]> {
  if (cached.length && Date.now() - cachedAt < 5 * 60 * 1000) return cached;
  const api = getApiUrl();
  if (!api) return cached;

  try {
    const res = await fetchWithTimeout(`${api}/storefront/redirects`, {
      headers: { "x-tenant-domain": "localhost" },
      next: { revalidate: 300 },
      timeoutMs: 5_000,
    });
    if (res.ok) {
      cached = (await res.json()) as RedirectRule[];
      cachedAt = Date.now();
    }
  } catch {
    // API unavailable — skip redirects
  }
  return cached;
}

export async function middleware(request: NextRequest) {
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
    "/((?!_next/static|_next/image|favicon.ico|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|xml|txt)$).*)",
  ],
};
