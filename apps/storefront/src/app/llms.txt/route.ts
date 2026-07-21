import {
  getShopProducts,
  getCategories,
  getJournalPosts,
  getSitemapUrls,
  isProductInStock,
  getProductCategory,
  type Product,
} from "@/lib/api";
import { getSiteUrl, resolveSiteSeo } from "@/lib/site";

// Revalidate every hour — reflects new/changed products from DB
export const revalidate = 3600;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function inrPrice(product: Product): string {
  const v = product.variants[0];
  if (!v) return "";
  const price = v.price.toLocaleString("en-IN");
  if (v.compareAtPrice && v.compareAtPrice > v.price) {
    return `₹${price} (was ₹${v.compareAtPrice.toLocaleString("en-IN")})`;
  }
  return `₹${price}`;
}

// Fetch every page of shop products — returns de-duped Product[]
async function fetchAllProducts(): Promise<Product[]> {
  const first = await getShopProducts(1).catch(() => null);
  if (!first) return [];

  const pages: Promise<typeof first>[] = [];
  for (let p = 2; p <= first.totalPages; p++) {
    pages.push(getShopProducts(p));
  }
  const rest = await Promise.allSettled(pages);
  const products = [
    ...first.data,
    ...rest.flatMap((r) => (r.status === "fulfilled" ? r.value.data : [])),
  ];

  // De-dupe by _id
  const seen = new Set<string>();
  return products.filter((p) => {
    if (seen.has(p._id)) return false;
    seen.add(p._id);
    return true;
  });
}

// ---------------------------------------------------------------------------
// GET /llms.txt  — AI index file (llms.txt standard)
// ---------------------------------------------------------------------------
export async function GET() {
  const siteUrl = getSiteUrl();
  const [seo, products, categories, posts, sitemapUrls] = await Promise.allSettled([
    resolveSiteSeo(),
    fetchAllProducts(),
    getCategories().catch(() => [] as Awaited<ReturnType<typeof getCategories>>),
    getJournalPosts().catch(() => [] as Awaited<ReturnType<typeof getJournalPosts>>),
    getSitemapUrls().catch(() => null),
  ]);

  const brand = seo.status === "fulfilled" ? seo.value : { name: "Bamboo Eco-Hub", description: "" };
  const allProducts = products.status === "fulfilled" ? products.value : [];
  const allCategories = categories.status === "fulfilled" ? categories.value : [];
  const allPosts = posts.status === "fulfilled" ? posts.value : [];
  const sitemap = sitemapUrls.status === "fulfilled" ? sitemapUrls.value : null;

  const inStockProducts = allProducts.filter((p) => isProductInStock(p));
  const totalProducts = sitemap?.products.length ?? allProducts.length;

  // ---------------------------------------------------------------------------
  // Build llms.txt document
  // ---------------------------------------------------------------------------
  const lines: string[] = [];

  lines.push(`# ${brand.name}`);
  lines.push(``);
  if (brand.description) lines.push(`> ${brand.description}`);
  lines.push(``);

  // -- About --
  lines.push(`## About`);
  lines.push(`${brand.name} is an Indian ecommerce store specialising in handcrafted, eco-friendly bamboo home decor.`);
  lines.push(`We sell handwoven bamboo pendant lights, floor lamps, table lamps, string lights, wall art, and sustainable home accents — shipped across India.`);
  lines.push(``);
  lines.push(`- Website: ${siteUrl}`);
  lines.push(`- Country: India`);
  lines.push(`- Currency: INR (₹)`);
  lines.push(`- Language: English`);
  lines.push(`- Total products: ${totalProducts}`);
  lines.push(`- In stock now: ${inStockProducts.length}`);
  lines.push(``);

  // -- Products --
  lines.push(`## Products (${allProducts.length} total)`);
  lines.push(`All products are handcrafted from natural bamboo and rattan. Prices in INR.`);
  lines.push(``);
  for (const p of allProducts) {
    const cat = getProductCategory(p);
    const price = inrPrice(p);
    const stock = isProductInStock(p) ? "In stock" : "Out of stock";
    const catLabel = cat ? ` · ${cat.name}` : "";
    const rating = p.ratingSummary.count > 0
      ? ` · ⭐ ${p.ratingSummary.avg.toFixed(1)} (${p.ratingSummary.count} reviews)`
      : "";
    lines.push(`- [${p.title}](${siteUrl}/product/${p.slug}) — ${price}${catLabel} · ${stock}${rating}`);
  }
  lines.push(``);

  // -- Categories --
  if (allCategories.length > 0) {
    lines.push(`## Categories`);
    for (const c of allCategories) {
      lines.push(`- [${c.name}](${siteUrl}/collections/${c.slug})`);
    }
    lines.push(``);
  }

  // -- Blog & Guides --
  if (allPosts.length > 0) {
    lines.push(`## Blog & Buying Guides`);
    for (const post of allPosts) {
      const section = post.type === "guide" ? "guides" : "journal";
      lines.push(`- [${post.title ?? post.slug}](${siteUrl}/${section}/${post.slug})`);
    }
    lines.push(``);
  }

  // -- Policies --
  lines.push(`## Policies & Trust`);
  lines.push(`- Returns: 30-day free returns, by mail, no restocking fee`);
  lines.push(`- Shipping: Free shipping across India, 4–7 business days`);
  lines.push(`- Payment: UPI, Cards, Net Banking, COD`);
  lines.push(`- [Return Policy](${siteUrl}/pages/return-policy)`);
  lines.push(`- [Contact Us](${siteUrl}/pages/contact)`);
  lines.push(``);

  // -- Discovery files --
  lines.push(`## Discovery`);
  lines.push(`- Sitemap: ${siteUrl}/sitemap.xml`);
  lines.push(`- Product feed: ${siteUrl}/feed.xml`);
  lines.push(`- Robots: ${siteUrl}/robots.txt`);
  lines.push(`- AI policy: ${siteUrl}/ai.txt`);
  lines.push(`- Full catalog: ${siteUrl}/llms-full.txt`);
  lines.push(``);

  // -- Crawling --
  lines.push(`## Crawling guidelines`);
  lines.push(`Public product, category, and content pages may be indexed and cited with attribution.`);
  lines.push(`Do not index: /cart/, /checkout/, /account/, /api/, /order/, /login/, /register/`);
  lines.push(`Preferred citation: ${brand.name} — {page title} (${siteUrl}{path})`);

  return new Response(lines.join("\n").trim() + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "noindex",
    },
  });
}
