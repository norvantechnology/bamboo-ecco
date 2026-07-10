"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { searchProducts } from "@/lib/auth";
import { ProductGridSkeleton, PageLoader, Spinner } from "@/components/ui/loading";
import type { Product } from "@/lib/api";

function SearchBar({ initialQ, onSearch }: { initialQ: string; onSearch: (q: string) => void }) {
  const [value, setValue] = useState(initialQ);

  useEffect(() => setValue(initialQ), [initialQ]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
      className="mt-6 flex flex-col gap-2 sm:flex-row"
    >
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search bamboo decor, lamps, storage…"
          className="input-field !mt-0 w-full py-3.5 pl-10 pr-4"
        />
      </div>
      <button
        type="submit"
        className="h-12 w-full shrink-0 rounded-xl bg-primary px-6 text-base font-semibold text-surface transition-opacity hover:opacity-90 active:scale-[0.98] sm:w-auto sm:min-w-[7rem]"
      >
        Search
      </button>
    </form>
  );
}

function SearchResults() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  function runSearch(query: string) {
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  useEffect(() => {
    if (!q.trim()) {
      setProducts([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    searchProducts(q)
      .then((res) => {
        setProducts(res.data);
        setTotal(res.total);
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <>
      <SearchBar initialQ={q} onSearch={runSearch} />

      {q ? (
        <p className="mt-6 flex items-center gap-2 text-muted">
          {loading ? (
            <>
              <Spinner size="sm" /> Searching for &ldquo;{q}&rdquo;…
            </>
          ) : (
            `${total} result${total !== 1 ? "s" : ""} for "${q}"`
          )}
        </p>
      ) : (
        <p className="mt-6 text-muted">Try &ldquo;bamboo lamp&rdquo;, &ldquo;storage basket&rdquo;, or &ldquo;side table&rdquo;</p>
      )}

      {loading && <div className="mt-8"><ProductGridSkeleton count={8} /></div>}

      {!loading && products.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}

      {!loading && q && products.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-muted">No products found for &ldquo;{q}&rdquo;</p>
          <button type="button" onClick={() => runSearch("bamboo")} className="mt-4 text-sm font-medium text-secondary hover:underline">
            Browse all bamboo products →
          </button>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-3xl sm:text-4xl">Search</h1>
      <Suspense fallback={<PageLoader label="Loading search…" />}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
