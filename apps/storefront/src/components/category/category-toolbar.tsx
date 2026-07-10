"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

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
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
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
        <div className="flex items-center gap-2 text-sm">
          {currentPage > 1 && (
            <Link href={href(currentPage - 1)} className="rounded-lg border border-border px-3 py-1">
              Previous
            </Link>
          )}
          <span className="text-muted">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link href={href(currentPage + 1)} className="rounded-lg border border-border px-3 py-1">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
