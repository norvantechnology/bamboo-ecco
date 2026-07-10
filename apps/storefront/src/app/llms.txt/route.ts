import { getSiteUrl, INDEXABLE_STATIC_ROUTES, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const dynamic = "force-static";

export async function GET() {
  const siteUrl = getSiteUrl();

  const body = `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

## About
${SITE_NAME} is an Indian ecommerce store for sustainable bamboo furniture and eco-friendly home decor.
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
- Categories: \`${siteUrl}/category/{slug}\`
- Collections: \`${siteUrl}/collections/{slug}\`
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
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
