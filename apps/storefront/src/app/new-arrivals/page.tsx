import type { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { getNewArrivals } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "New Arrivals",
  description: "Fresh bamboo pieces for modern homes — handcrafted decor and furniture.",
  path: "/new-arrivals",
});

export default async function NewArrivalsPage() {
  const products = await getNewArrivals().catch(() => []);

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="font-display text-3xl text-primary sm:text-4xl">New Arrivals</h1>
      <p className="mt-2 text-muted">Fresh pieces for modern homes</p>
      <div className="mt-8 sm:mt-10 product-grid">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
}
