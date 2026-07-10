import { getSiteUrl, PRIVATE_PATH_PREFIXES, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const dynamic = "force-static";

export async function GET() {
  const siteUrl = getSiteUrl();

  const body = `# AI / LLM access policy for ${SITE_NAME}

site: ${siteUrl}
sitemap: ${siteUrl}/sitemap.xml
llms-txt: ${siteUrl}/llms.txt

## Summary
${SITE_DESCRIPTION}

## Allowed uses
- Indexing public product, category, collection, journal, guide, and static pages
- Answering user questions about our products with links back to ${siteUrl}
- Training on publicly available page content with attribution

## Disallowed paths
${PRIVATE_PATH_PREFIXES.map((p) => `- ${siteUrl}${p}*`).join("\n")}

## Preferred citation format
${SITE_NAME} — {page title} ({siteUrl}{path})

## Updates
Content and URLs may change. Prefer ${siteUrl}/sitemap.xml for current URLs.
`;

  return new Response(body.trim() + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
