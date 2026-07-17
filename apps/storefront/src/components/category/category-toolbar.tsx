"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, ArrowUpDown } from "lucide-react";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
] as const;

export function CategoryToolbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "newest";

  function href(sort: string) {
    const params = new URLSearchParams();
    params.set("sort", sort);
    // Reset to page 1 when sort changes
    const q = params.toString();
    return `${pathname}?${q}`;
  }

  return (
    <div className="mb-5 rounded-xl border border-border bg-surface sm:mb-6">
      <div className="flex items-center justify-between gap-3 p-2.5 sm:p-4">
        <label className="relative flex min-w-0 flex-1 items-center gap-2 sm:hidden">
          <ArrowUpDown className="h-4 w-4 shrink-0 text-muted" />
          <span className="sr-only">Sort products</span>
          <select
            value={currentSort}
            onChange={(e) => router.push(href(e.target.value))}
            className="min-w-0 flex-1 appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-8 text-sm font-medium text-foreground outline-none focus:border-secondary"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute right-3 h-4 w-4 rotate-90 text-muted" />
        </label>

        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          <span className="text-sm text-muted">Sort:</span>
          {SORTS.map((s) => (
            <Link
              key={s.value}
              href={href(s.value)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                currentSort === s.value
                  ? "border-secondary bg-secondary text-white shadow-warm"
                  : "border border-border hover:bg-background"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
