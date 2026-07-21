import { getSitemapUrls } from "@/lib/api";
import { getSiteUrl, resolveSiteSeo } from "@/lib/site";
import { getApiUrl, getTenantDomain } from "@/lib/api-config";
import type { Product } from "@/lib/api";

/**
 * GET /feed.xml
 *
 * Google Merchant Center product feed — RSS 2.0 + Google Shopping (g:) namespace.
 *
 * ✅ Fully dynamic — all data fetched live from the database
 * ✅ Deduplicated — no duplicate product IDs or URLs
 * ✅ Validated against Google Merchant Center spec
 * ✅ Handles sale prices (compareAtPrice), multiple images, availability
 * ✅ Clean XML — no empty/blank lines that cause feed validation errors
 *
 * Register in Google Merchant Center → Products → Feeds → Scheduled fetch
 * Feed URL: https://yourdomain.com/feed.xml
 *
 * @see https://support.google.com/merchants/answer/7052112
 */
export async function GET() {
  const apiUrl = getApiUrl();
  const tenantDomain = getTenantDomain();
  const siteUrl = getSiteUrl(); // e.g. http://bambooecohub.com  (no trailing slash)

  // Brand name comes from the DB tenant document — fully dynamic
  const seo = await resolveSiteSeo().catch(() => ({
    name: "Bamboo Eco-Hub",
    description: "",
    locale: "en_IN",
    defaultTitle: "",
    themeColor: "",
    backgroundColor: "",
    gscVerification: "",
  }));
  const brandName = seo.name || "Bamboo Eco-Hub";

  // ── 1. Get ALL product slugs from the sitemap API (dynamic from DB)
  let productSlugs: string[] = [];
  if (apiUrl) {
    const sitemapData = await getSitemapUrls().catch(() => null);
    productSlugs = sitemapData?.products?.map((p) => p.slug) ?? [];
  }

  // Deduplicate slugs (safety net — sitemap should not have duplicates)
  const uniqueSlugs = [...new Set(productSlugs)];

  // ── 2. Fetch full product data in parallel batches of 10
  //       Uses the same API + tenant-domain as the rest of the storefront
  const products: Product[] = [];

  if (apiUrl && uniqueSlugs.length > 0) {
    const BATCH_SIZE = 10;
    for (let i = 0; i < uniqueSlugs.length; i += BATCH_SIZE) {
      const batch = uniqueSlugs.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((slug) =>
          fetch(`${apiUrl}/products/${slug}`, {
            headers: {
              "Content-Type": "application/json",
              "x-tenant-domain": tenantDomain,
            },
            // Revalidate every hour — Google only fetches once/day anyway
            next: { revalidate: 3600 },
          }).then((r) => (r.ok ? (r.json() as Promise<Product>) : null))
        )
      );

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          products.push(result.value);
        }
      }
    }
  }

  // ── 3. Filter, deduplicate by _id, and build XML items
  //       Only include products that have price + at least one image
  const seenIds = new Set<string>();
  const validProducts = products.filter((p) => {
    if (!p._id || seenIds.has(p._id)) return false; // deduplicate by DB id
    if (!p.variants?.[0]?.price) return false;       // must have a price
    if (!p.images?.length) return false;              // must have at least one image
    if (p.status === "archived") return false;        // don't list archived products
    seenIds.add(p._id);
    return true;
  });

  const xmlItems = validProducts
    .map((p) => buildFeedItem(p, siteUrl, brandName))
    .filter(Boolean) // remove any empty strings
    .join("\n");

  const now = new Date().toUTCString();
  const feedDescription = escXml(
    seo.description || `${brandName} — handcrafted bamboo home products`
  );

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0"`,
    `  xmlns:g="http://base.google.com/ns/1.0"`,
    `  xmlns:atom="http://www.w3.org/2005/Atom">`,
    `  <channel>`,
    `    <title>${escXml(brandName)}</title>`,
    `    <link>${siteUrl}</link>`,
    `    <description>${feedDescription}</description>`,
    `    <language>en-IN</language>`,
    `    <lastBuildDate>${now}</lastBuildDate>`,
    `    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />`,
    xmlItems,
    `  </channel>`,
    `</rss>`,
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Public CDN cache for 1 hour; Google's own crawl schedule handles freshness
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
    },
  });
}

// ---------------------------------------------------------------------------
// Feed item builder — produces a clean <item> block with no empty lines
// ---------------------------------------------------------------------------

function buildFeedItem(
  product: Product,
  siteUrl: string,
  brandName: string
): string {
  const variant = product.variants[0];
  if (!variant?.price) return "";

  const productUrl = `${siteUrl}/product/${product.slug}`;
  const currency = variant.currency || "INR";

  // ── Images
  // Primary = first non-lifestyle image; fall back to all images
  const galleryImages = product.images.filter((i) => i.type !== "lifestyle");
  const allImages = galleryImages.length ? galleryImages : product.images;
  const primaryImage = allImages[0];
  if (!primaryImage?.url) return ""; // no image → skip (Google requires it)

  const additionalImages = allImages.slice(1, 10); // Google allows up to 10 total

  // ── Availability
  const inStock =
    product.status !== "out_of_stock" && (variant.stockQty ?? 0) > 0;
  const availability = inStock ? "in stock" : "out of stock";

  // ── Pricing (Google Merchant Center spec):
  //    g:price      = the REGULAR / LIST price (always required)
  //    g:sale_price = the discounted price (only when on sale)
  //    When compareAtPrice > price: product is on sale.
  //      → g:price = compareAtPrice (original, higher)
  //      → g:sale_price = price (current sale, lower)
  //    When no sale:
  //      → g:price = price (regular)
  const isOnSale =
    variant.compareAtPrice != null && variant.compareAtPrice > variant.price;
  const listPrice = isOnSale
    ? variant.compareAtPrice!.toFixed(2)
    : variant.price.toFixed(2);
  const salePrice = isOnSale ? variant.price.toFixed(2) : null;

  // ── Description: strip any HTML, normalise whitespace, cap at 5000 chars
  const description = (product.description || product.title)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);

  const categoryObj =
    typeof product.categoryId === "object" && product.categoryId?.name
      ? product.categoryId
      : null;
  const productType = categoryObj
    ? `Home and Garden > ${categoryObj.name}`
    : "Home and Garden";

  const catName = categoryObj?.name?.toLowerCase() || "";
  let googleProductCategory = "Home & Garden > Decor";
  if (catName.includes("light") || catName.includes("lamp") || catName.includes("pendant")) {
    googleProductCategory = "Home & Garden > Lighting > Lamps";
  } else if (catName.includes("furniture") || catName.includes("table") || catName.includes("chair")) {
    googleProductCategory = "Home & Garden > Furniture";
  }

  // ── Build lines array — only push lines that have real values
  const lines: string[] = [];

  lines.push(`    <item>`);
  lines.push(`      <g:id>${escXml(toFeedId(product.slug))}</g:id>`);
  lines.push(`      <title>${escXml(product.meta?.title || product.title)}</title>`);
  lines.push(`      <description>${escXml(description)}</description>`);
  lines.push(`      <link>${productUrl}</link>`);
  lines.push(`      <g:image_link>${escXml(primaryImage.url)}</g:image_link>`);

  // Additional images (only if they exist)
  for (const img of additionalImages) {
    if (img.url) {
      lines.push(`      <g:additional_image_link>${escXml(img.url)}</g:additional_image_link>`);
    }
  }

  lines.push(`      <g:availability>${availability}</g:availability>`);
  lines.push(`      <g:condition>new</g:condition>`);
  lines.push(`      <g:price>${listPrice} ${currency}</g:price>`);

  // Sale price — only emitted when there IS a sale
  if (salePrice) {
    lines.push(`      <g:sale_price>${salePrice} ${currency}</g:sale_price>`);
  }

  lines.push(`      <g:brand>${escXml(brandName)}</g:brand>`);
  lines.push(`      <g:google_product_category>${escXml(googleProductCategory)}</g:google_product_category>`);
  lines.push(`      <g:product_type>${escXml(productType)}</g:product_type>`);

  // MPN/SKU — only if present
  if (variant.sku) {
    lines.push(`      <g:mpn>${escXml(variant.sku)}</g:mpn>`);
    // Having an MPN means identifier_exists = yes
    lines.push(`      <g:identifier_exists>yes</g:identifier_exists>`);
  } else {
    lines.push(`      <g:identifier_exists>no</g:identifier_exists>`);
  }

  // Material — only if present in specs
  if (product.specs?.material) {
    lines.push(`      <g:material>${escXml(product.specs.material)}</g:material>`);
  }

  // Variant color/size — only the recognised Google attribute names
  if (variant.attributes) {
    for (const [key, val] of Object.entries(variant.attributes)) {
      const k = key.toLowerCase();
      // Only emit known Google Shopping attribute names
      if (["color", "size", "pattern", "size_type", "size_system"].includes(k)) {
        lines.push(`      <g:${k}>${escXml(String(val))}</g:${k}>`);
      }
    }
  }

  // Free shipping to India
  lines.push(`      <g:shipping>`);
  lines.push(`        <g:country>IN</g:country>`);
  lines.push(`        <g:service>Standard</g:service>`);
  lines.push(`        <g:price>0.00 ${currency}</g:price>`);
  lines.push(`      </g:shipping>`);

  lines.push(`    </item>`);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// XML character escaping — prevents feed parse errors from & < > " '
// ---------------------------------------------------------------------------
function escXml(raw: string): string {
  return String(raw)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ---------------------------------------------------------------------------
// Google Merchant Center g:id — max 50 characters
// If the slug is longer, truncate and append a 6-char hash so it stays unique
// ---------------------------------------------------------------------------
function toFeedId(slug: string): string {
  if (slug.length <= 50) return slug;
  // Simple djb2 hash → 6 hex chars
  let hash = 5381;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) + hash) ^ slug.charCodeAt(i);
  }
  const suffix = (hash >>> 0).toString(16).slice(0, 6); // e.g. "a1b2c3"
  return `${slug.slice(0, 43)}-${suffix}`; // 43 + 1 + 6 = 50 chars exactly
}
