import { getSiteUrl, INDEXABLE_STATIC_ROUTES, resolveSiteSeo } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const siteUrl = getSiteUrl();
  const seo = await resolveSiteSeo();

  const body = `# ${seo.name}

> ${seo.description}

## About
${seo.name} is an Indian ecommerce store for sustainable bamboo furniture and eco-friendly home decor.
We sell handcrafted bamboo furniture online across India — living room decor, storage, and natural accents for modern homes.

## Primary topics
- Bamboo furniture online India
- Eco-friendly home decor
- Sustainable furniture India
- Handcrafted bamboo decor
- Space-saving furniture for apartments

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
