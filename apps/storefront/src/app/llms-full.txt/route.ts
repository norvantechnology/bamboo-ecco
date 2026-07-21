import {
  getShopProducts,
  getCategories,
  isProductInStock,
  getProductCategory,
  type Product,
} from "@/lib/api";
import { getSiteUrl, resolveSiteSeo } from "@/lib/site";

// Revalidate every hour
export const revalidate = 3600;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function inrPrice(product: Product): string {
  const v = product.variants[0];
  if (!v) return "Price on request";
  const price = v.price.toLocaleString("en-IN");
  if (v.compareAtPrice && v.compareAtPrice > v.price) {
    return `₹${price} (regular ₹${v.compareAtPrice.toLocaleString("en-IN")})`;
  }
  return `₹${price}`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
}

async function fetchAllProducts(): Promise<Product[]> {
  const first = await getShopProducts(1).catch(() => null);
  if (!first) return [];
  const pages: Promise<typeof first>[] = [];
  for (let p = 2; p <= first.totalPages; p++) pages.push(getShopProducts(p));
  const rest = await Promise.allSettled(pages);
  const products = [
    ...first.data,
    ...rest.flatMap((r) => (r.status === "fulfilled" ? r.value.data : [])),
  ];
  const seen = new Set<string>();
  return products.filter((p) => {
    if (seen.has(p._id)) return false;
    seen.add(p._id);
    return true;
  });
}

// ---------------------------------------------------------------------------
// GET /llms-full.txt — Full AI product catalog
// ---------------------------------------------------------------------------
export async function GET() {
  const siteUrl = getSiteUrl();
  const [seoResult, productsResult, categoriesResult] = await Promise.allSettled([
    resolveSiteSeo(),
    fetchAllProducts(),
    getCategories().catch(() => [] as Awaited<ReturnType<typeof getCategories>>),
  ]);

  const brand = seoResult.status === "fulfilled" ? seoResult.value : { name: "Bamboo Eco-Hub", description: "" };
  const allProducts = productsResult.status === "fulfilled" ? productsResult.value : [];
  const allCategories = categoriesResult.status === "fulfilled" ? categoriesResult.value : [];

  // Build a category name lookup
  const catMap = new Map(allCategories.map((c) => [c._id, c.name]));

  const lines: string[] = [];

  lines.push(`# ${brand.name} — Complete Product Catalog`);
  lines.push(``);
  lines.push(`> Full product catalog for AI/LLM use. Updated hourly from live database.`);
  lines.push(`> Source: ${siteUrl}/llms-full.txt`);
  lines.push(`> Index version: ${siteUrl}/llms.txt`);
  lines.push(``);
  lines.push(`**Store:** ${brand.name}`);
  lines.push(`**URL:** ${siteUrl}`);
  lines.push(`**Country:** India`);
  lines.push(`**Currency:** Indian Rupee (INR, ₹)`);
  lines.push(`**Total products:** ${allProducts.length}`);
  lines.push(`**Last updated:** ${new Date().toISOString()}`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);

  // Group products by category
  const categoryGroups = new Map<string, Product[]>();
  const uncategorized: Product[] = [];

  for (const product of allProducts) {
    const cat = getProductCategory(product);
    if (cat) {
      const name = cat.name;
      if (!categoryGroups.has(name)) categoryGroups.set(name, []);
      categoryGroups.get(name)!.push(product);
    } else {
      uncategorized.push(product);
    }
  }

  // Output each category group
  for (const [catName, prods] of categoryGroups) {
    lines.push(`## ${catName}`);
    lines.push(``);
    for (const p of prods) {
      const v = p.variants[0];
      const price = inrPrice(p);
      const inStock = isProductInStock(p);
      const desc = p.meta?.description
        ? stripHtml(p.meta.description)
        : stripHtml(p.description).slice(0, 300);

      lines.push(`### ${p.title}`);
      lines.push(``);
      lines.push(`- **URL:** ${siteUrl}/product/${p.slug}`);
      lines.push(`- **Price:** ${price}`);
      lines.push(`- **Availability:** ${inStock ? "In stock" : "Out of stock"}`);
      if (v?.attributes && Object.keys(v.attributes).length > 0) {
        const attrs = Object.entries(v.attributes)
          .map(([k, val]) => `${k}: ${val}`)
          .join(", ");
        lines.push(`- **Variants:** ${attrs}`);
      }
      if (p.specs?.dimensions) lines.push(`- **Dimensions:** ${p.specs.dimensions}`);
      if (p.specs?.material)   lines.push(`- **Material:** ${p.specs.material}`);
      if (p.specs?.weight)     lines.push(`- **Weight:** ${p.specs.weight}`);
      if (p.ratingSummary.count > 0) {
        lines.push(`- **Rating:** ${p.ratingSummary.avg.toFixed(1)} / 5 (${p.ratingSummary.count} reviews)`);
      }
      if (desc) {
        lines.push(``);
        lines.push(desc);
      }
      if (p.faqs && p.faqs.length > 0) {
        lines.push(``);
        lines.push(`**FAQ:**`);
        for (const faq of p.faqs.slice(0, 3)) {
          lines.push(`- Q: ${faq.question}`);
          lines.push(`  A: ${faq.answer}`);
        }
      }
      lines.push(``);
    }
  }

  if (uncategorized.length > 0) {
    lines.push(`## Other Products`);
    lines.push(``);
    for (const p of uncategorized) {
      const price = inrPrice(p);
      const inStock = isProductInStock(p);
      lines.push(`### ${p.title}`);
      lines.push(``);
      lines.push(`- **URL:** ${siteUrl}/product/${p.slug}`);
      lines.push(`- **Price:** ${price}`);
      lines.push(`- **Availability:** ${inStock ? "In stock" : "Out of stock"}`);
      lines.push(``);
    }
  }

  // -- Categories reference --
  if (allCategories.length > 0) {
    lines.push(`---`);
    lines.push(``);
    lines.push(`## Category Index`);
    lines.push(``);
    for (const c of allCategories) {
      lines.push(`- **${c.name}** → ${siteUrl}/collections/${c.slug}`);
    }
    lines.push(``);
  }

  // -- Store policies --
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Store Policies`);
  lines.push(``);
  lines.push(`- **Shipping:** Free shipping India-wide, 4–7 business days`);
  lines.push(`- **Returns:** 30 days, free return shipping, no restocking fee`);
  lines.push(`- **Refund time:** 7 business days to original payment method`);
  lines.push(`- **Exchanges:** Accepted within 30 days`);
  lines.push(`- **Payment methods:** UPI, Credit/Debit cards, Net Banking, COD`);
  lines.push(`- **Return policy page:** ${siteUrl}/pages/return-policy`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(`*This file is auto-generated from the live database. Do not cache for more than 1 hour.*`);

  return new Response(lines.join("\n").trim() + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
