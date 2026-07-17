import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryToolbar } from "@/components/category/category-toolbar";
import { InfiniteProductGrid } from "@/components/product/infinite-product-grid";
import { getShopProducts } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";

const VALID_SORTS = ["newest", "price-asc", "price-desc", "rating"] as const;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Shop Bamboo Furniture & Home Decor Online",
    description:
      "Browse handcrafted bamboo furniture, eco-friendly home decor, and space-saving pieces for modern Indian homes.",
    path: "/shop",
  });
}

interface Props {
  searchParams: Promise<{ sort?: string }>;
}

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const sortParam = sp.sort ?? "newest";
  const sort = VALID_SORTS.includes(sortParam as (typeof VALID_SORTS)[number])
    ? (sortParam as (typeof VALID_SORTS)[number])
    : "newest";

  const result = await getShopProducts(1, sort).catch(() => null);
  const products = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;

  return (
    <div className="container-page py-5 sm:py-14">
      <h1 className="font-display text-2xl text-primary sm:text-4xl">
        Shop Bamboo Furniture &amp; Home Decor
      </h1>
      <p className="mt-2 text-sm text-muted sm:text-base">
        {total} handcrafted eco-friendly piece{total !== 1 ? "s" : ""} for Indian homes
      </p>

      <div className="mt-6 sm:mt-8">
        <Suspense
          fallback={<div className="mb-4 h-10 animate-pulse rounded-lg bg-border sm:mb-6 sm:h-12" />}
        >
          <CategoryToolbar />
        </Suspense>
      </div>

      <InfiniteProductGrid
        key={`shop-${sort}`}
        initialProducts={products}
        totalPages={totalPages}
        source={{ type: "shop", sort }}
        emptyMessage="No products available yet."
      />
    </div>
  );
}
