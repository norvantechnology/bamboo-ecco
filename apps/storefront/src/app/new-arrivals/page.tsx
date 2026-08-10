import type { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { JsonLd } from "@/components/seo/json-ld";
import { getNewArrivals } from "@/lib/api";
import { absoluteUrl, buildPageMetadata, productItemListJsonLd } from "@/lib/seo";
import { resolveSiteSeo } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "New Arrivals — Handcrafted Bamboo Decor",
    description: "Fresh bamboo pieces for modern homes — handcrafted decor, lamps, and furniture just arrived.",
    path: "/new-arrivals",
  });
}

export default async function NewArrivalsPage() {
  const [products, seo] = await Promise.all([
    getNewArrivals(100).catch(() => []),
    resolveSiteSeo(),
  ]);

  return (
    <div className="container-page py-5 sm:py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "New Arrivals",
          url: absoluteUrl("/new-arrivals"),
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
        <h1 className="font-display text-2xl text-primary sm:text-4xl">New Arrivals</h1>
        <span className="text-xs font-semibold text-muted sm:text-sm">{products.length} products</span>
      </div>
      <p className="mt-1 text-sm text-muted sm:mt-2 sm:text-base">Fresh handcrafted pieces for modern homes</p>
      <div className="mt-5 product-grid sm:mt-10">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
}
