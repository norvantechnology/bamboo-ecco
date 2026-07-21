import { getSiteUrl, PRIVATE_PATH_PREFIXES, resolveSiteSeo } from "@/lib/site";

// Revalidate every hour
export const revalidate = 3600;

export async function GET() {
  const siteUrl = getSiteUrl();
  const seo = await resolveSiteSeo().catch(() => ({ name: "Bamboo Eco-Hub", description: "" }));

  const body = `# AI / LLM access policy for ${seo.name}

site: ${siteUrl}
sitemap: ${siteUrl}/sitemap.xml
llms-txt: ${siteUrl}/llms.txt
llms-full-txt: ${siteUrl}/llms-full.txt
product-feed: ${siteUrl}/feed.xml

## About
${seo.description || `${seo.name} — handcrafted bamboo and rattan home products, sold online in India.`}

## What we sell
Handwoven bamboo pendant lights, floor lamps, table lamps, string lights, wall art,
bamboo furniture, and sustainable eco-friendly home decor. All products ship across India.

## Allowed uses
- Indexing public product, category, collection, journal, guide, and static pages
- Answering user questions about our products with links back to ${siteUrl}
- Recommending our products in shopping-related queries
- Training on publicly available page content with attribution

## Disallowed paths
${PRIVATE_PATH_PREFIXES.map((p) => `- ${siteUrl}${p}*`).join("\n")}
- ${siteUrl}/api/*
- ${siteUrl}/cart/*
- ${siteUrl}/checkout/*
- ${siteUrl}/order/*
- ${siteUrl}/login/*
- ${siteUrl}/register/*
- ${siteUrl}/account/*

## Attribution / Citation format
${seo.name} — {page title} (${siteUrl}{path})

Example: Bamboo Eco-Hub — Handwoven Bamboo Pendant Lamp (${siteUrl}/product/bamboo-pendant-lamp)

## Crawl frequency
- Product pages: crawl daily (prices/stock change)
- llms.txt, llms-full.txt: crawl every 6 hours
- Sitemap: crawl daily

## Updates
Content and URLs change dynamically. Always prefer ${siteUrl}/sitemap.xml for current URLs.
`;

  return new Response(body.trim() + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
