"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import type { Category } from "@/lib/api";
import { cn } from "@/lib/utils";

function getRoots(categories: Category[]) {
  return categories.length > 0 && categories[0].children !== undefined
    ? categories
    : categories.filter((c) => !c.parentId);
}

function CategoryColumn({
  root,
  index,
  animate,
}: {
  root: Category;
  index: number;
  animate: boolean;
}) {
  const hasChildren = (root.children?.length ?? 0) > 0;

  return (
    <div
      className={cn(
        "mega-menu-col group/col flex min-w-0 flex-col gap-3.5 p-5 sm:gap-4 sm:p-6",
        "transition-colors duration-200 ease-out",
      )}
      style={
        animate
          ? { animationDelay: `${index * 35}ms` }
          : { opacity: 0 }
      }
    >
      <div className="flex items-start gap-3">
        {root.imageUrl ? (
          <Link
            href={`/category/${root.slug}`}
            className="relative mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-md bg-background ring-1 ring-border/60"
            aria-hidden
            tabIndex={-1}
          >
            <Image
              src={root.imageUrl}
              alt=""
              width={32}
              height={32}
              className="h-full w-full object-cover"
              sizes="32px"
            />
          </Link>
        ) : (
          <span
            className="mt-0.5 h-8 w-8 shrink-0 rounded-md bg-background ring-1 ring-border/50"
            aria-hidden
          />
        )}

        <div className="min-w-0 flex-1 space-y-2.5">
          <Link
            href={`/category/${root.slug}`}
            className="group/name relative inline-block max-w-full font-display text-base font-semibold leading-snug text-foreground transition-colors hover:text-secondary sm:text-lg"
          >
            <span className="relative">
              {root.name}
              <span
                className="pointer-events-none absolute -bottom-0.5 left-0 h-[1.5px] w-full origin-left scale-x-0 bg-gold transition-transform duration-300 ease-out group-hover/name:scale-x-100"
                aria-hidden
              />
            </span>
          </Link>

          <Link
            href={`/category/${root.slug}`}
            className="group/shop inline-flex items-center gap-1 text-xs font-medium text-secondary sm:text-sm"
          >
            <span className="relative">
              Shop all
              <span
                className="pointer-events-none absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-300 ease-out group-hover/shop:scale-x-100"
                aria-hidden
              />
            </span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/shop:translate-x-[3px]" />
          </Link>
        </div>
      </div>

      {/* Short warm-gold accent — replaces full-width grey rule */}
      <div className="h-px w-8 bg-gold/80" aria-hidden />

      {hasChildren ? (
        <ul className="space-y-0.5">
          {root.children!.map((child) => (
            <li key={child._id}>
              <Link
                href={`/category/${child.slug}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm text-muted transition-colors hover:bg-background/80 hover:text-foreground"
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
          className="group/story mt-1 inline-flex items-center gap-1 pt-1 text-xs font-medium text-muted transition-colors hover:text-secondary sm:text-sm"
        >
          <span className="relative">
            Collection story
            <span
              className="pointer-events-none absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-300 ease-out group-hover/story:scale-x-100"
              aria-hidden
            />
          </span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/story:translate-x-[3px]" />
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
          "absolute left-0 top-full z-50 pt-2.5 transition-all duration-200 ease-out",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-[0.98] opacity-0",
        )}
      >
        <div
          className={cn(
            "mega-menu-panel w-[min(calc(100vw-2rem),56rem)] overflow-hidden rounded-2xl border border-border bg-surface-elevated",
            open && "mega-menu-open",
          )}
        >
          <div className="flex items-center justify-between gap-4 border-b border-border/70 bg-background/40 px-5 py-3.5 sm:px-6 sm:py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted/70">
              Shop by room
            </p>
            <Link
              href="/shop"
              className="group/all inline-flex items-center gap-1.5 rounded-full border border-gold/35 bg-gold/10 px-3 py-1.5 text-sm font-semibold text-secondary transition-colors hover:border-gold/55 hover:bg-gold/18"
              onClick={() => setOpen(false)}
            >
              All products
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/all:translate-x-[3px]" />
            </Link>
          </div>

          <div
            className={cn(
              "grid grid-cols-1 divide-y divide-border/60 sm:divide-x sm:divide-y-0",
              gridClass,
            )}
          >
            {roots.map((root, i) => (
              <CategoryColumn key={root._id} root={root} index={i} animate={open} />
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
