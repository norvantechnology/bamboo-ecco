import type { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { getShopProducts } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Shop Bamboo Furniture & Home Decor Online",
  description: "Browse handcrafted bamboo furniture, eco-friendly home decor, and space-saving pieces for modern Indian homes.",
  path: "/shop",
});

export default async function ShopPage() {
  const products = await getShopProducts().catch(() => []);

  return (
    <div className="container-page py-5 sm:py-14">
      <h1 className="font-display text-2xl text-primary sm:text-4xl">Shop Bamboo Furniture &amp; Home Decor</h1>
      <p className="mt-2 text-sm text-muted sm:mt-2 sm:text-base">{products.length} handcrafted eco-friendly pieces for Indian homes</p>
      <div className="mt-6 product-grid sm:mt-10">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
}
