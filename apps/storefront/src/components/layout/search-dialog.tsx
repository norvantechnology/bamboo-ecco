"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp } from "lucide-react";
import { searchProducts } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { Spinner } from "@/components/ui/loading";
import { MotionDialog, MotionFade } from "@/components/ui/motion";

const POPULAR_SEARCHES = ["Bamboo", "Storage", "Lamp", "Tray", "Organizer", "Kitchen"];

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

  const showEmptyState = !loading && query.trim().length < 2;

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
        <div className="flex items-center gap-2 border-b-2 border-border px-4 py-3 transition-colors focus-within:border-secondary sm:py-0">
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
            className="motion-pop flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-foreground"
          >
            <X className="icon-brand" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 sm:max-h-80">
          {showEmptyState && (
            <MotionFade>
              <div className="p-3">
                <p className="flex items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-wider text-muted">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Popular searches
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleSearch(term)}
                      className="rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground transition-transform hover:border-secondary hover:text-secondary active:scale-95"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </MotionFade>
          )}
          {loading && (
            <div className="flex items-center justify-center gap-2 p-8">
              <Spinner size="sm" />
              <span className="text-sm text-muted">Searching…</span>
            </div>
          )}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <MotionFade>
              <p className="p-4 text-sm text-muted">No products found for &ldquo;{query.trim()}&rdquo;.</p>
            </MotionFade>
          )}
          {results.map((product, i) => {
            const v = product.variants[0];
            const thumb = product.images?.find((img) => img.type !== "lifestyle") ?? product.images?.[0];
            return (
              <MotionFade key={product._id} delay={i * 30}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-background active:bg-background"
                  onClick={() => {
                    setOpen(false);
                    router.push(`/product/${product.slug}`);
                  }}
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
                    {thumb && (
                      <Image src={thumb.url} alt={thumb.alt || product.title} fill sizes="48px" className="object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-medium">{product.title}</span>
                    {v && <span className="mt-0.5 block text-sm text-muted">{formatPrice(v.price)}</span>}
                  </span>
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
