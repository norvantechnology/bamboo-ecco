import { getSitemapUrls } from "@/lib/api";
import { getSiteUrl, resolveSiteSeo } from "@/lib/site";
import { getApiUrl, getTenantDomain } from "@/lib/api-config";
import type { Product } from "@/lib/api";

/**
 * GET /feed/pinterest.xml
 *
 * Pinterest Catalog product feed — RSS 2.0 format (using the fully supported Google Shopping schema).
 * Deduplicated, dynamically fetched from the database, and optimized for Pinterest pins.
 *
 * Feed URL: https://bambooecohub.com/feed/pinterest.xml
 */
export async function GET() {
  const apiUrl = getApiUrl();
  const tenantDomain = getTenantDomain();
  const siteUrl = getSiteUrl();

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

  // Get ALL product slugs from the database
  let productSlugs: string[] = [];
  if (apiUrl) {
    const sitemapData = await getSitemapUrls().catch(() => null);
    productSlugs = sitemapData?.products?.map((p) => p.slug) ?? [];
  }

  const uniqueSlugs = [...new Set(productSlugs)];
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

  const seenIds = new Set<string>();
  const validProducts = products.filter((p) => {
    if (!p._id || seenIds.has(p._id)) return false;
    if (!p.variants?.[0]?.price) return false;
    if (!p.images?.length) return false;
    if (p.status === "archived") return false;
    seenIds.add(p._id);
    return true;
  });

  const xmlItems = validProducts
    .map((p) => buildFeedItem(p, siteUrl, brandName))
    .filter(Boolean)
    .join("\n");

  const now = new Date().toUTCString();
  const feedDescription = escXml(
    stripPromoText(seo.description || `${brandName} — handcrafted bamboo home products`)
  );

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0"`,
    `  xmlns:g="http://base.google.com/ns/1.0"`,
    `  xmlns:atom="http://www.w3.org/2005/Atom">`,
    `  <channel>`,
    `    <title>${escXml(brandName)} Products</title>`,
    `    <link>${siteUrl}</link>`,
    `    <description>${feedDescription}</description>`,
    `    <language>en-IN</language>`,
    `    <lastBuildDate>${now}</lastBuildDate>`,
    `    <atom:link href="${siteUrl}/feed/pinterest.xml" rel="self" type="application/rss+xml" />`,
    xmlItems,
    `  </channel>`,
    `</rss>`,
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=7200",
    },
  });
}

function buildFeedItem(
  product: Product,
  siteUrl: string,
  brandName: string
): string {
  const variant = product.variants[0];
  if (!variant?.price) return "";

  const productUrl = `${siteUrl}/product/${product.slug}`;
  const currency = variant.currency || "INR";

  // For Pinterest Catalogs, we want high-resolution product images.
  const galleryImages = product.images.filter((i) => i.type !== "lifestyle");
  const allImages = galleryImages.length ? galleryImages : product.images;
  const primaryImage = allImages[0];
  if (!primaryImage?.url) return "";

  const additionalImages = allImages.slice(1, 10);

  const inStock =
    product.status !== "out_of_stock" && (variant.stockQty ?? 0) > 0;
  const availability = inStock ? "in stock" : "out of stock";

  const isOnSale =
    variant.compareAtPrice != null && variant.compareAtPrice > variant.price;
  const listPrice = isOnSale
    ? variant.compareAtPrice!.toFixed(2)
    : variant.price.toFixed(2);
  const salePrice = isOnSale ? variant.price.toFixed(2) : null;

  // Use product.title (clean product name) — never meta.title which may
  // contain promotional text like "| ₹2199 | Free Shipping India".
  const feedTitle = stripPromoText(product.title);

  const description = stripPromoText(
    (product.description || product.title)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  ).slice(0, 5000);

  const categoryObj =
    typeof product.categoryId === "object" && product.categoryId?.name
      ? product.categoryId
      : null;
  const productType = categoryObj
    ? `Home & Garden > ${categoryObj.name}`
    : "Home & Garden";

  const catName = categoryObj?.name?.toLowerCase() || "";
  let googleProductCategory = "Home & Garden > Decor";
  if (catName.includes("light") || catName.includes("lamp") || catName.includes("pendant")) {
    googleProductCategory = "Home & Garden > Lighting > Lamps";
  } else if (catName.includes("furniture") || catName.includes("table") || catName.includes("chair")) {
    googleProductCategory = "Home & Garden > Furniture";
  }

  const lines: string[] = [];

  lines.push(`    <item>`);
  lines.push(`      <g:id>${escXml(toFeedId(product.slug))}</g:id>`);
  lines.push(`      <title>${escXml(feedTitle)}</title>`);
  lines.push(`      <description>${escXml(description)}</description>`);
  lines.push(`      <link>${productUrl}</link>`);
  lines.push(`      <g:image_link>${escXml(primaryImage.url)}</g:image_link>`);

  for (const img of additionalImages) {
    if (img.url) {
      lines.push(`      <g:additional_image_link>${escXml(img.url)}</g:additional_image_link>`);
    }
  }

  lines.push(`      <g:availability>${availability}</g:availability>`);
  lines.push(`      <g:condition>new</g:condition>`);
  lines.push(`      <g:price>${listPrice} ${currency}</g:price>`);

  if (salePrice) {
    lines.push(`      <g:sale_price>${salePrice} ${currency}</g:sale_price>`);
  }

  lines.push(`      <g:brand>${escXml(brandName)}</g:brand>`);
  lines.push(`      <g:google_product_category>${escXml(googleProductCategory)}</g:google_product_category>`);
  lines.push(`      <g:product_type>${escXml(productType)}</g:product_type>`);

  if (variant.sku) {
    lines.push(`      <g:mpn>${escXml(variant.sku)}</g:mpn>`);
    lines.push(`      <g:identifier_exists>yes</g:identifier_exists>`);
  } else {
    lines.push(`      <g:identifier_exists>no</g:identifier_exists>`);
  }

  if (product.specs?.material) {
    lines.push(`      <g:material>${escXml(product.specs.material)}</g:material>`);
  }

  if (variant.attributes) {
    for (const [key, val] of Object.entries(variant.attributes)) {
      const k = key.toLowerCase();
      if (["color", "size", "pattern", "size_type", "size_system"].includes(k)) {
        lines.push(`      <g:${k}>${escXml(String(val))}</g:${k}>`);
      }
    }
  }

  lines.push(`      <g:shipping>`);
  lines.push(`        <g:country>IN</g:country>`);
  lines.push(`        <g:service>Standard</g:service>`);
  lines.push(`        <g:price>0.00 ${currency}</g:price>`);
  lines.push(`      </g:shipping>`);
  lines.push(`    </item>`);

  return lines.join("\n");
}

/**
 * Strip promotional text that Google Merchant Center flags as
 * "Additional or promotional info" violations.
 */
function stripPromoText(text: string): string {
  return text
    // Remove "| ₹XXXX | Free Shipping India" or similar appended price/promo
    .replace(/\s*\|\s*[₹$€]\s*[\d,.]+\s*/gi, " ")
    .replace(/\s*\|\s*free\s+shipping[^|]*/gi, " ")
    // Remove standalone promotional phrases
    .replace(/free\s+(shipping|delivery)\s*(india|pan[- ]?india|all\s+over)?/gi, "")
    .replace(/best\s+price\s+guarantee/gi, "")
    .replace(/money\s+back\s+guarantee/gi, "")
    .replace(/\d+[- ]?day\s+(money\s+back\s+)?return[s]?/gi, "")
    .replace(/\bcod\s+available\b/gi, "")
    .replace(/\bbuy\s+now\b/gi, "")
    .replace(/\bbuy\s+online\b/gi, "")
    .replace(/limited\s+time\s+offer/gi, "")
    .replace(/\bsale\b/gi, "")
    .replace(/\bdiscount\b/gi, "")
    .replace(/flat\s+\d+%\s+off/gi, "")
    .replace(/\boff\s+on\s+all\b/gi, "")
    // Remove "Buy ... online at ₹XXXX on BrandName." pattern from descriptions
    .replace(/buy\s+.{1,60}?online\s+at\s+[₹$€]?\s*[\d,.]+\s*(on\s+[\w\s-]+\.)?/gi, "")
    // Remove "searching to buy X online in India" or "buyers searching X online"
    .replace(/\b(searching|looking)\s+to\s+buy\s+([\w\s,-]{1,60}?)\s+online(\s+in\s+India)?/gi, "")
    .replace(/\bbuyers?\s+searching\s+([\w\s,-]{1,60}?)\s+online(\s+in\s+India)?/gi, "")
    .replace(/\bshopper[s]?\s+looking\s+to\s+buy\s+([\w\s,-]{1,60}?)\s+online(\s+in\s+India)?/gi, "")
    .replace(/\bonline\s+in\s+India\b/gi, "in India")
    // Remove "100% handcrafted artisan bamboo decor with free delivery/shipping"
    .replace(/100%\s+handcrafted\s+artisan\s+bamboo\s+decor\s+with\s+free\s+\w+/gi, "")
    // Clean up leftover pipes, double spaces, leading/trailing junk
    .replace(/\s*\|\s*$/g, "")
    .replace(/^\s*\|\s*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function escXml(raw: string): string {
  return String(raw)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toFeedId(slug: string): string {
  if (slug.length <= 50) return slug;
  let hash = 5381;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) + hash) ^ slug.charCodeAt(i);
  }
  const suffix = (hash >>> 0).toString(16).slice(0, 6);
  return `${slug.slice(0, 43)}-${suffix}`;
}
