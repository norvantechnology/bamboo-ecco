"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
] as const;

interface Props {
  totalPages: number;
}

export function CategoryToolbar({ totalPages }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "newest";
  const currentPage = Number(searchParams.get("page") ?? "1");

  function href(page: number, sort?: string) {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    params.set("sort", sort ?? currentSort);
    const q = params.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  return (
    <div className="mb-5 rounded-xl border border-border bg-surface sm:mb-6">
      <div className="flex items-center justify-between gap-3 p-2.5 sm:p-4">
        {/* Mobile: compact native dropdown */}
        <label className="relative flex min-w-0 flex-1 items-center gap-2 sm:hidden">
          <ArrowUpDown className="h-4 w-4 shrink-0 text-muted" />
          <span className="sr-only">Sort products</span>
          <select
            value={currentSort}
            onChange={(e) => router.push(href(1, e.target.value))}
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

        {/* Desktop: pill buttons */}
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          <span className="text-sm text-muted">Sort:</span>
          {SORTS.map((s) => (
            <Link
              key={s.value}
              href={href(1, s.value)}
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

        {totalPages > 1 && (
          <div className="flex shrink-0 items-center gap-1.5 text-sm sm:gap-2">
            {currentPage > 1 && (
              <Link
                href={href(currentPage - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-background sm:h-auto sm:w-auto sm:px-3 sm:py-1"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Previous</span>
              </Link>
            )}
            <span className="whitespace-nowrap text-xs text-muted sm:text-sm">
              {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={href(currentPage + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-background sm:h-auto sm:w-auto sm:px-3 sm:py-1"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Next</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
