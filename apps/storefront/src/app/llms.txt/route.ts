import { getSiteUrl, INDEXABLE_STATIC_ROUTES, resolveSiteSeo } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const siteUrl = getSiteUrl();
  const seo = await resolveSiteSeo();

  const body = `# ${seo.name}

> ${seo.description}

## About
${seo.name} is an Indian ecommerce store for sustainable bamboo home decor, handcrafted bamboo lamps & lights, and eco-friendly furniture.
We sell handwoven bamboo pendant lights, floor lamps, table lamps, string lights, and natural home accents online across India.

## Primary topics
- Bamboo lamps and lights online India
- Handwoven bamboo pendant lights
- Eco-friendly floor lamps and table lamps
- Sustainable bamboo home decor
- Handcrafted rattan lighting India
- Bamboo furniture and natural accents

## Canonical site
${siteUrl}

## Key pages
${INDEXABLE_STATIC_ROUTES.map((p) => `- ${siteUrl}${p === "/" ? "" : p}`).join("\n")}

## Content types
- Products: \`${siteUrl}/product/{slug}\`
- Categories: \`${siteUrl}/collections/{slug}\`
- Journal: \`${siteUrl}/journal/{slug}\`
- Buying guides: \`${siteUrl}/guides/{slug}\`
- Static pages: \`${siteUrl}/pages/{slug}\`

## Discovery files
- Sitemap: ${siteUrl}/sitemap.xml
- Robots: ${siteUrl}/robots.txt
- AI policy: ${siteUrl}/ai.txt

## Crawling
Public product, category, and content pages may be indexed and cited with attribution.
Do not index account, cart, checkout, or order pages.

## Contact
${siteUrl}/pages/contact
`;

  return new Response(body.trim() + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
