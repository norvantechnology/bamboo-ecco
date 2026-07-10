"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { searchProducts } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { Spinner } from "@/components/ui/loading";
import { MotionDialog, MotionFade } from "@/components/ui/motion";

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<import("@/lib/api").Product[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await searchProducts(q.trim());
      setResults(data.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function goToSearch() {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="nav-icon-btn touch-target flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-secondary"
        aria-label="Search"
      >
        <Search className="icon-brand text-foreground" />
      </button>

      <MotionDialog
        open={open}
        onClose={() => setOpen(false)}
        className="flex h-full flex-col border-border bg-surface shadow-xl sm:h-auto sm:max-h-[80vh] sm:max-w-lg sm:rounded-xl sm:border"
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:py-0">
          <Search className="icon-brand shrink-0 text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && query.trim() && goToSearch()}
            placeholder="Search products…"
            className="flex-1 bg-transparent py-3 text-base outline-none sm:py-4"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="touch-target motion-pop"
          >
            <X className="icon-brand text-muted" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 sm:max-h-80">
          {loading && (
            <div className="flex items-center justify-center gap-2 p-8">
              <Spinner size="sm" />
              <span className="text-sm text-muted">Searching…</span>
            </div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <MotionFade>
              <p className="p-4 text-sm text-muted">No products found.</p>
            </MotionFade>
          )}
          {results.map((product, i) => {
            const v = product.variants[0];
            return (
              <MotionFade key={product._id} delay={i * 30}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-colors hover:bg-background"
                  onClick={() => {
                    setOpen(false);
                    router.push(`/product/${product.slug}`);
                  }}
                >
                  <span className="text-sm font-medium">{product.title}</span>
                  {v && <span className="text-sm text-muted">{formatPrice(v.price)}</span>}
                </button>
              </MotionFade>
            );
          })}
          {query.trim().length >= 2 && (
            <button
              type="button"
              onClick={goToSearch}
              className="mt-2 w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-secondary transition-colors hover:bg-background"
            >
              View all results for &ldquo;{query}&rdquo; →
            </button>
          )}
        </div>
      </MotionDialog>
    </>
  );
}
