import type { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { getFeaturedProducts } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Best Sellers",
  description: "Our most-loved bamboo decor — popular picks from Terra Living.",
  path: "/best-sellers",
});

export default async function BestSellersPage() {
  const products = await getFeaturedProducts().catch(() => []);

  return (
    <div className="container-page py-5 sm:py-14">
      <h1 className="font-display text-2xl text-primary sm:text-4xl">Best Sellers</h1>
      <p className="mt-1 text-sm text-muted sm:mt-2 sm:text-base">Our most-loved bamboo decor</p>
      <div className="mt-5 product-grid sm:mt-10">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
}
