import { getSitemapUrls } from "@/lib/api";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Must match apps/storefront/public/indexnow-key.txt and /{key}.txt */
const INDEXNOW_KEY = "4f6c719d593372c3b265d03b84b52f7b";

/**
 * GET /api/auto-index?secret=...
 * Submits new/priority URLs to IndexNow (Bing, Yandex, etc.).
 * Protect with AUTO_INDEX_SECRET (or INDEXNOW_KEY) query/header in production.
 */
export async function GET(request: Request) {
  const siteUrl = getSiteUrl();
  const expected =
    process.env.AUTO_INDEX_SECRET || process.env.INDEXNOW_KEY || INDEXNOW_KEY;
  const url = new URL(request.url);
  const provided =
    url.searchParams.get("secret") ||
    request.headers.get("x-auto-index-secret") ||
    "";

  // Allow unauthenticated only on localhost for manual testing
  const isLocal = /localhost|127\.0\.0\.1/.test(siteUrl);
  if (!isLocal && provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results: Record<string, unknown> = {
    note: "Google sitemap ping is deprecated; use Search Console + IndexNow.",
  };

  try {
    const sitemapData = await getSitemapUrls().catch(() => null);
    const urls: string[] = [
      siteUrl,
      `${siteUrl}/shop`,
      `${siteUrl}/journal`,
      `${siteUrl}/guides`,
      `${siteUrl}/new-arrivals`,
      `${siteUrl}/best-sellers`,
    ];

    if (sitemapData) {
      for (const c of sitemapData.categories ?? []) {
        urls.push(`${siteUrl}/collections/${c.slug}`);
      }
      for (const p of sitemapData.products ?? []) {
        urls.push(`${siteUrl}/product/${p.slug}`);
      }
      for (const post of sitemapData.posts ?? []) {
        const prefix = post.type === "guide" ? "guides" : "journal";
        urls.push(`${siteUrl}/${prefix}/${post.slug}`);
      }
    }

    const uniqueUrls = [...new Set(urls)].slice(0, 10000);
    const host = new URL(siteUrl).host;
    const keyLocation = `${siteUrl}/indexnow-key.txt`;

    const indexNowRes = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation,
        urlList: uniqueUrls,
      }),
    });

    const bodyText = await indexNowRes.text().catch(() => "");
    results.indexNow = {
      status: indexNowRes.status,
      submittedUrlsCount: uniqueUrls.length,
      ok: indexNowRes.ok || indexNowRes.status === 202,
      keyLocation,
      body: bodyText.slice(0, 200),
    };
  } catch (err) {
    results.indexNow = { error: err instanceof Error ? err.message : String(err) };
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
