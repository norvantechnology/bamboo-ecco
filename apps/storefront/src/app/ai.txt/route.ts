import { getSiteUrl, PRIVATE_PATH_PREFIXES, resolveSiteSeo } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const siteUrl = getSiteUrl();
  const seo = await resolveSiteSeo();

  const body = `# AI / LLM access policy for ${seo.name}

site: ${siteUrl}
sitemap: ${siteUrl}/sitemap.xml
llms-txt: ${siteUrl}/llms.txt

## Summary
${seo.description}

## Allowed uses
- Indexing public product, category, collection, journal, guide, and static pages
- Answering user questions about our products with links back to ${siteUrl}
- Training on publicly available page content with attribution

## Disallowed paths
${PRIVATE_PATH_PREFIXES.map((p) => `- ${siteUrl}${p}*`).join("\n")}

## Preferred citation format
${seo.name} — {page title} ({siteUrl}{path})

## Updates
Content and URLs may change. Prefer ${siteUrl}/sitemap.xml for current URLs.
`;

  return new Response(body.trim() + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
