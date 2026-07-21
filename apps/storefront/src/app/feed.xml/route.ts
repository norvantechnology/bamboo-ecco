import { getSitemapUrls } from "@/lib/api";
import { getSiteUrl, resolveSiteSeo } from "@/lib/site";
import { getApiUrl, getTenantDomain } from "@/lib/api-config";
import type { Product } from "@/lib/api";

/**
 * GET /feed.xml
 *
 * Google Merchant Center product feed — RSS 2.0 + Google Shopping namespace.
 * Fetches all products dynamically from the database and returns a valid
 * Google Merchant Center XML feed.
 *
 * Register this URL in Google Merchant Center → Products → Feeds → Scheduled fetch.
 *
 * @see https://support.google.com/merchants/answer/7052112
 */
export async function GET() {
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const seo = await resolveSiteSeo().catch(() => ({
    name: "Bamboo Eco-Hub",
    description: "",
  }));
  const brandName = seo.name || "Bamboo Eco-Hub";

  // ── 1. Get all product slugs from the sitemap endpoint
  const sitemapData = await getSitemapUrls().catch(() => null);
  const productSlugs = sitemapData?.products?.map((p) => p.slug) ?? [];

  // ── 2. Fetch full product data for each slug in parallel (batches of 10)
  const products: Product[] = [];
  const BATCH = 10;

  for (let i = 0; i < productSlugs.length; i += BATCH) {
    const batch = productSlugs.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map((slug) =>
        fetch(`${getApiUrl()}/products/${slug}`, {
          headers: {
            "Content-Type": "application/json",
            "x-tenant-domain": getTenantDomain(),
          },
          next: { revalidate: 3600 }, // Cache 1 hour — feed doesn't need to be real-time
        }).then((r) => (r.ok ? (r.json() as Promise<Product>) : null))
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        products.push(result.value);
      }
    }
  }

  // ── 3. Build XML feed
  const now = new Date().toUTCString();
  const items = products
    .filter(
      (p) =>
        p.variants?.[0]?.price &&
        p.images?.length > 0 &&
        p.status !== "archived"
    )
    .map((product) => buildFeedItem(product, siteUrl, brandName))
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:g="http://base.google.com/ns/1.0"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escXml(brandName)}</title>
    <link>${siteUrl}</link>
    <description>${escXml(seo.description || `${brandName} — handcrafted bamboo home products`)}</description>
    <language>en-IN</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Cache for 1 hour in CDN; Google fetches on its own schedule anyway
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
    },
  });
}

// ---------------------------------------------------------------------------
// Feed item builder
// ---------------------------------------------------------------------------

function buildFeedItem(product: Product, siteUrl: string, brandName: string): string {
  const variant = product.variants[0];
  if (!variant) return "";

  const productUrl = `${siteUrl}/product/${product.slug}`;

  // Images — first non-lifestyle image is primary; rest are additional
  const galleryImages = product.images.filter((i) => i.type !== "lifestyle");
  const allImages = galleryImages.length ? galleryImages : product.images;
  const primaryImage = allImages[0];
  const additionalImages = allImages.slice(1, 10); // Google supports up to 10

  // Availability
  const inStock =
    product.status !== "out_of_stock" && (variant.stockQty ?? 0) > 0;
  const availability = inStock ? "in stock" : "out of stock";

  // Price — Google expects "1299.00 INR" format
  const currency = variant.currency || "INR";
  const price = `${variant.price.toFixed(2)} ${currency}`;

  // Sale price (compareAtPrice = original; price = sale)
  const salePriceTag =
    variant.compareAtPrice && variant.compareAtPrice > variant.price
      ? `      <g:sale_price>${variant.price.toFixed(2)} ${currency}</g:sale_price>
      <g:price>${variant.compareAtPrice.toFixed(2)} ${currency}</g:price>`
      : `      <g:price>${price}</g:price>`;

  // Description — strip HTML tags, cap at 5000 chars
  const description = (product.description || product.title)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);

  // Category → Google product type
  const category =
    typeof product.categoryId === "object" && product.categoryId?.name
      ? `Home & Garden > ${product.categoryId.name}`
      : "Home & Garden";

  // Additional image tags
  const additionalImageTags = additionalImages
    .map((img) => `      <g:additional_image_link>${escXml(img.url)}</g:additional_image_link>`)
    .join("\n");

  // Material tag (only if present)
  const materialTag = product.specs?.material
    ? `      <g:material>${escXml(product.specs.material)}</g:material>`
    : "";

  // Multi-variant attribute labels (size, color etc.)
  const variantAttrs = variant.attributes
    ? Object.entries(variant.attributes)
        .filter(([k]) => ["color", "size", "pattern"].includes(k.toLowerCase()))
        .map(([k, v]) => `      <g:${k.toLowerCase()}>${escXml(String(v))}</g:${k.toLowerCase()}>`)
        .join("\n")
    : "";

  return `    <item>
      <g:id>${escXml(product.slug)}</g:id>
      <g:title>${escXml(product.meta?.title || product.title)}</g:title>
      <g:description>${escXml(description)}</g:description>
      <g:link>${productUrl}</g:link>
      <g:image_link>${escXml(primaryImage.url)}</g:image_link>
${additionalImageTags ? additionalImageTags + "\n" : ""}      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
${salePriceTag}
      <g:brand>${escXml(brandName)}</g:brand>
      <g:product_type>${escXml(category)}</g:product_type>
      <g:identifier_exists>no</g:identifier_exists>
${variant.sku ? `      <g:mpn>${escXml(variant.sku)}</g:mpn>` : ""}
${materialTag}
${variantAttrs}
      <g:shipping>
        <g:country>IN</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 ${currency}</g:price>
      </g:shipping>
      <g:shipping_weight>0.5 kg</g:shipping_weight>
      <g:return_policy_label>free-returns</g:return_policy_label>
    </item>`;
}

// ---------------------------------------------------------------------------
// XML escape — prevents feed validation errors from special characters
// ---------------------------------------------------------------------------
function escXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
