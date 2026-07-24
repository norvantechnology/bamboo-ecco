"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "@/components/product/product-card";
import { Spinner } from "@/components/ui/loading";
import { getRuntimeApiUrl, getTenantDomain } from "@/lib/api-config";
import type { PaginatedProducts, Product } from "@/lib/api";

export type ProductFeedSource =
  | { type: "shop"; sort?: string }
  | { type: "category"; slug: string; sort?: string }
  | { type: "search"; q: string };

interface Props {
  initialProducts: Product[];
  initialPage?: number;
  totalPages: number;
  source: ProductFeedSource;
  emptyMessage?: string;
}

async function fetchProductsPage(
  source: ProductFeedSource,
  page: number,
): Promise<PaginatedProducts> {
  const base = getRuntimeApiUrl();
  const params = new URLSearchParams({ page: String(page) });
  let path = "";

  if (source.type === "shop") {
    if (source.sort) params.set("sort", source.sort);
    path = `/products/shop?${params}`;
  } else if (source.type === "category") {
    if (source.sort) params.set("sort", source.sort);
    path = `/products/category-slug/${encodeURIComponent(source.slug)}?${params}`;
  } else {
    params.set("q", source.q);
    path = `/products/search?${params}`;
  }

  const res = await fetch(`${base}${path}`, {
    headers: { "x-tenant-domain": getTenantDomain() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load products (${res.status})`);
  return res.json();
}

export function InfiniteProductGrid({
  initialProducts,
  initialPage = 1,
  totalPages,
  source,
  emptyMessage = "No products found.",
}: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(initialPage < totalPages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Reset when sort / category / query changes (new server payload)
  useEffect(() => {
    setProducts(initialProducts);
    setPage(initialPage);
    setHasMore(initialPage < totalPages);
    setError(null);
  }, [initialProducts, initialPage, totalPages, source]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    const nextPage = page + 1;
    try {
      const result = await fetchProductsPage(source, nextPage);
      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p._id));
        const added = result.data.filter((p) => !seen.has(p._id));
        return [...prev, ...added];
      });
      setPage(result.page);
      setHasMore(result.page < result.totalPages);
    } catch {
      setError("Couldn’t load more products. Scroll again to retry.");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [hasMore, page, source]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (products.length === 0 && !loading) {
    return <p className="py-10 text-center text-sm text-muted sm:py-16">{emptyMessage}</p>;
  }

  return (
    <div>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} reveal={true} />
        ))}
      </div>

      <div ref={sentinelRef} className="flex min-h-12 items-center justify-center py-8" aria-hidden={!loading}>
        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Spinner size="sm" /> Loading more…
          </p>
        )}
        {!loading && error && (
          <button
            type="button"
            onClick={() => void loadMore()}
            className="text-sm font-medium text-secondary hover:underline"
          >
            {error}
          </button>
        )}
        {!loading && !hasMore && products.length > 0 && (
          <p className="text-sm text-muted">You’ve reached the end</p>
        )}
      </div>
    </div>
  );
}
