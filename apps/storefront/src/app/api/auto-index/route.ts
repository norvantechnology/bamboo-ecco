import { getSitemapUrls } from "@/lib/api";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * GET /api/auto-index
 * Automatically submits sitemap and indexable URLs to Google & Bing IndexNow
 */
export async function GET() {
  const siteUrl = getSiteUrl();
  const sitemapUrl = `${siteUrl}/sitemap.xml`;

  const results: Record<string, unknown> = {};

  // 1. Google Sitemap Ping
  try {
    const googleRes = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      { method: "GET" }
    );
    results.googleSitemapPing = {
      status: googleRes.status,
      ok: googleRes.ok,
    };
  } catch (err) {
    results.googleSitemapPing = { error: err instanceof Error ? err.message : String(err) };
  }

  // 2. IndexNow Ping for Bing, Yandex, Seznam, Naver
  try {
    const sitemapData = await getSitemapUrls().catch(() => null);
    const urls: string[] = [
      siteUrl,
      `${siteUrl}/shop`,
      `${siteUrl}/journal`,
      `${siteUrl}/guides`,
    ];

    if (sitemapData) {
      if (sitemapData.categories) {
        for (const c of sitemapData.categories) urls.push(`${siteUrl}/collections/${c.slug}`);
      }
      if (sitemapData.products) {
        for (const p of sitemapData.products) urls.push(`${siteUrl}/product/${p.slug}`);
      }
      if (sitemapData.posts) {
        for (const post of sitemapData.posts) {
          const prefix = post.type === "guide" ? "guides" : "journal";
          urls.push(`${siteUrl}/${prefix}/${post.slug}`);
        }
      }
    }

    const uniqueUrls = [...new Set(urls)].slice(0, 100);

    const indexNowRes = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(siteUrl).host,
        key: "41b770fb0f2ef7309c3a47fbc6a55920",
        keyLocation: `${siteUrl}/41b770fb0f2ef7309c3a47fbc6a55920.txt`,
        urlList: uniqueUrls,
      }),
    });

    results.indexNow = {
      status: indexNowRes.status,
      submittedUrlsCount: uniqueUrls.length,
      ok: indexNowRes.ok || indexNowRes.status === 202,
    };
  } catch (err) {
    results.indexNow = { error: err instanceof Error ? err.message : String(err) };
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}
