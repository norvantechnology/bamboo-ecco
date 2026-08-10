import type { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { JsonLd } from "@/components/seo/json-ld";
import { getFeaturedProducts } from "@/lib/api";
import { absoluteUrl, buildPageMetadata, productItemListJsonLd } from "@/lib/seo";
import { resolveSiteSeo } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Best Sellers — Most-Loved Bamboo Decor",
    description: "Our most-loved bamboo decor — popular handcrafted lamps and home accents chosen by customers across India.",
    path: "/best-sellers",
  });
}

export default async function BestSellersPage() {
  const [products, seo] = await Promise.all([
    getFeaturedProducts(100).catch(() => []),
    resolveSiteSeo(),
  ]);

  return (
    <div className="container-page py-5 sm:py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Best Sellers",
          url: absoluteUrl("/best-sellers"),
          mainEntity: productItemListJsonLd(
            products.map((product) => ({
              slug: product.slug,
              title: product.title,
              description: product.description,
              status: product.status,
              images: product.images,
              variants: product.variants,
              ratingSummary: product.ratingSummary,
            })),
            { brandName: seo.name, maxItems: 24 },
          ),
        }}
      />
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-2xl text-primary sm:text-4xl">Best Sellers</h1>
        <span className="text-xs font-semibold text-muted sm:text-sm">{products.length} products</span>
      </div>
      <p className="mt-1 text-sm text-muted sm:mt-2 sm:text-base">Our most-loved bamboo decor — chosen by customers across India</p>
      <div className="mt-5 product-grid sm:mt-10">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
}
