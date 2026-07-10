"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import type { Category } from "@/lib/api";
import { cn } from "@/lib/utils";

function getRoots(categories: Category[]) {
  return categories.length > 0 && categories[0].children !== undefined
    ? categories
    : categories.filter((c) => !c.parentId);
}

function CategoryColumn({ root }: { root: Category }) {
  const hasChildren = (root.children?.length ?? 0) > 0;

  return (
    <div className="flex min-w-0 flex-col gap-3 p-4 sm:p-5">
      <div className="space-y-1">
        <Link
          href={`/category/${root.slug}`}
          className="block font-display text-base font-semibold leading-snug text-foreground transition-colors hover:text-secondary sm:text-lg"
        >
          {root.name}
        </Link>
        <Link
          href={`/category/${root.slug}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline sm:text-sm"
        >
          Shop all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {hasChildren ? (
        <ul className="space-y-0.5 border-t border-border pt-3">
          {root.children!.map((child) => (
            <li key={child._id}>
              <Link
                href={`/category/${child.slug}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
              >
                <span className="min-w-0 truncate">{child.name}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Link
          href={`/collections/${root.slug}`}
          className="mt-auto inline-flex items-center gap-1 border-t border-border pt-3 text-xs font-medium text-muted transition-colors hover:text-secondary sm:text-sm"
        >
          Collection story
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export function CategoryMegaMenu({ categories }: { categories: Category[] }) {
  const roots = getRoots(categories);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (roots.length === 0) return null;

  const gridClass =
    roots.length <= 2
      ? "sm:grid-cols-2"
      : roots.length === 3
        ? "sm:grid-cols-3"
        : roots.length <= 6
          ? "sm:grid-cols-2 lg:grid-cols-3"
          : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-base font-medium transition-colors duration-200",
          open ? "bg-background text-foreground" : "text-muted hover:text-foreground",
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Shop
        <ChevronDown
          className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      <div
        className={cn(
          "pointer-events-none absolute left-0 top-full z-50 pt-2 opacity-0 transition-all duration-200",
          open && "pointer-events-auto opacity-100",
        )}
      >
        <div className="w-[min(calc(100vw-2rem),56rem)] overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-warm-lg">
          <div className="flex items-center justify-between gap-4 border-b border-border bg-background/50 px-4 py-3 sm:px-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Shop by room</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline"
              onClick={() => setOpen(false)}
            >
              All products
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className={cn("grid grid-cols-1 divide-y divide-border sm:divide-x sm:divide-y-0", gridClass)}>
            {roots.map((root) => (
              <CategoryColumn key={root._id} root={root} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CategoryMobileSection({
  categories,
  onClose,
}: {
  categories: Category[];
  onClose: () => void;
}) {
  const roots = getRoots(categories);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (roots.length === 0) return null;

  return (
    <div className="border-t border-border px-4 py-3.5 max-[480px]:px-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Shop by category</p>
        <Link href="/shop" onClick={onClose} className="text-xs font-semibold text-secondary hover:underline">
          View all
        </Link>
      </div>

      <ul className="mt-2.5 space-y-1.5">
        {roots.map((root) => {
          const hasChildren = (root.children?.length ?? 0) > 0;
          const isOpen = expanded === root._id;

          return (
            <li key={root._id} className="overflow-hidden rounded-xl border border-border bg-background">
              <div className="flex items-stretch">
                <Link
                  href={`/category/${root.slug}`}
                  onClick={onClose}
                  className="flex min-w-0 flex-1 items-center gap-2 px-3 py-3 font-display text-[15px] font-semibold leading-tight max-[480px]:px-2.5"
                >
                  <span className="min-w-0 flex-1 truncate">{root.name}</span>
                  {!hasChildren && <ChevronRight className="h-4 w-4 shrink-0 text-muted/50" />}
                </Link>
                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : root._id)}
                    className="flex w-11 shrink-0 items-center justify-center border-l border-border text-muted transition-colors hover:text-foreground"
                    aria-expanded={isOpen}
                    aria-label={`${isOpen ? "Collapse" : "Expand"} ${root.name}`}
                  >
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")}
                    />
                  </button>
                )}
              </div>

              {hasChildren && isOpen && (
                <ul className="border-t border-border bg-surface/50 px-2 py-1.5">
                  <li>
                    <Link
                      href={`/category/${root.slug}`}
                      onClick={onClose}
                      className="block rounded-lg px-2 py-2 text-sm font-medium text-secondary"
                    >
                      All {root.name}
                    </Link>
                  </li>
                  {root.children!.map((child) => (
                    <li key={child._id}>
                      <Link
                        href={`/category/${child.slug}`}
                        onClick={onClose}
                        className="block rounded-lg px-2 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
