"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  totalPages: number;
  /** Extra query keys to keep (e.g. sort, q). Defaults to all current params except page. */
  preserveParams?: string[];
}

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((n) => pages.add(n));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((n) => pages.add(n));
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

export function Pagination({ totalPages, preserveParams }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Math.max(1, Number(searchParams.get("page") ?? "1"));

  if (totalPages <= 1) return null;

  function href(page: number) {
    const params = new URLSearchParams();
    if (preserveParams) {
      for (const key of preserveParams) {
        const v = searchParams.get(key);
        if (v) params.set(key, v);
      }
    } else {
      searchParams.forEach((v, k) => {
        if (k !== "page") params.set(k, v);
      });
    }
    if (page > 1) params.set("page", String(page));
    const q = params.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  const pages = pageNumbers(currentPage, totalPages);

  return (
    <nav
      className="mt-8 flex flex-col items-center gap-3 border-t border-border pt-6 sm:mt-10 sm:pt-8"
      aria-label="Pagination"
    >
      <p className="text-sm text-muted">
        Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
        <span className="font-medium text-foreground">{totalPages}</span>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {currentPage > 1 ? (
          <Link
            href={href(currentPage - 1)}
            className="inline-flex h-10 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-background"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Link>
        ) : (
          <span className="inline-flex h-10 cursor-not-allowed items-center gap-1 rounded-lg border border-border px-3 text-sm text-muted opacity-40">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </span>
        )}

        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e-${i}`} className="px-1 text-muted">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              aria-current={p === currentPage ? "page" : undefined}
              className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition-colors ${
                p === currentPage
                  ? "bg-primary text-surface"
                  : "border border-border bg-surface text-foreground hover:bg-background"
              }`}
            >
              {p}
            </Link>
          ),
        )}

        {currentPage < totalPages ? (
          <Link
            href={href(currentPage + 1)}
            className="inline-flex h-10 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-background"
            aria-label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="inline-flex h-10 cursor-not-allowed items-center gap-1 rounded-lg border border-border px-3 text-sm text-muted opacity-40">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </nav>
  );
}
