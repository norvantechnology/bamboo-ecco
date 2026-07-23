import type { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { getNewArrivals } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "New Arrivals",
    description: "Fresh bamboo pieces for modern homes — handcrafted decor and furniture.",
    path: "/new-arrivals",
  });
}

export default async function NewArrivalsPage() {
  const products = await getNewArrivals(100).catch(() => []);

  return (
    <div className="container-page py-5 sm:py-14">
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
