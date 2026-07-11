"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  User,
  ShoppingBag,
  Mail,
  ChevronRight,
  Store,
  Sparkles,
  Star,
  BookOpen,
  Newspaper,
  Package,
  Search,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MotionOverlay, MotionDrawer } from "@/components/ui/motion";
import { CategoryMobileSection } from "@/components/layout/category-nav";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { Category } from "@/lib/api";

const primaryNav = [
  { href: "/shop", label: "Shop All", icon: Store, description: "Browse every piece" },
  { href: "/new-arrivals", label: "New Arrivals", icon: Sparkles, description: "Fresh for your home" },
  { href: "/best-sellers", label: "Best Sellers", icon: Star, description: "Customer favourites" },
  { href: "/guides", label: "Guides", icon: BookOpen, description: "Care & styling tips" },
  { href: "/journal", label: "Journal", icon: Newspaper, description: "Stories & inspiration" },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  storeName: string;
  tagline?: string;
  categoryTree: Category[];
  cartCount: number;
}

export function MobileNav({
  open,
  onClose,
  storeName,
  tagline,
  categoryTree,
  cartCount,
}: MobileNavProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <MotionOverlay
        visible={open}
        onClick={onClose}
        className={cn(!open && "pointer-events-none")}
      />

      <MotionDrawer
        visible={open}
        className={cn(
          "absolute left-0 top-0 flex h-full w-[min(100vw-3rem,380px)] flex-col bg-surface shadow-[4px_0_40px_rgba(26,24,22,0.18)]",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
        )}
      >
        <nav role="dialog" aria-modal="true" aria-label="Main menu" className="flex h-full flex-col">
        {/* Header */}
        <div className="relative overflow-hidden bg-footer px-4 pb-4 pt-4 text-footer-fg sm:px-5 sm:pb-6 sm:pt-5">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                105deg,
                transparent,
                transparent 2px,
                rgba(196,165,116,0.4) 2px,
                rgba(196,165,116,0.4) 3px
              )`,
            }}
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-footer-border bg-footer-border/40 text-footer-fg transition-colors hover:bg-footer-border"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
          <Link href="/" onClick={onClose} className="relative block pr-12">
            <BrandLogo storeName={storeName} variant="dark" size="md" />
            <p className="mt-2 truncate text-[13px] font-medium leading-snug text-footer-muted sm:mt-2.5 sm:text-sm">
              {tagline || "Nature · Craftsmanship · Timeless Design"}
            </p>
          </Link>
          <Link
            href="/shop"
            onClick={onClose}
            className="relative mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform active:scale-[0.98] sm:mt-5 sm:py-3.5"
          >
            <Package className="h-4 w-4" />
            Shop Collection
          </Link>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto overscroll-contain">
          {/* Search shortcut */}
          <Link
            href="/search"
            onClick={onClose}
            className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-muted transition-colors hover:border-secondary/40 hover:bg-surface max-[480px]:mx-3 max-[480px]:px-3 max-[480px]:py-2.5"
          >
            <Search className="h-5 w-5 shrink-0 text-secondary" />
            <span className="text-base">Search products…</span>
          </Link>

          {/* Primary links */}
          <div className="px-3 py-3 max-[480px]:px-2">
            <p className="px-2 pb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-muted max-[480px]:px-1.5">Menu</p>
            <ul className="space-y-0.5">
              {primaryNav.map((link, i) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <li
                    key={link.href}
                    className={cn(
                      "transition-all duration-500",
                      open ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0",
                    )}
                    style={{ transitionDelay: open ? `${80 + i * 40}ms` : "0ms" }}
                  >
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors max-[480px]:gap-2.5 max-[480px]:px-2 max-[480px]:py-2",
                        active
                          ? "bg-secondary/10 text-foreground"
                          : "hover:bg-background active:bg-background",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                          active
                            ? "border-secondary/30 bg-secondary/15 text-secondary"
                            : "border-border bg-surface text-muted group-hover:border-secondary/20 group-hover:text-secondary",
                        )}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-base font-semibold leading-tight sm:text-lg">{link.label}</span>
                        <span className="block text-xs font-medium text-muted">{link.description}</span>
                      </span>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                          active ? "text-secondary" : "text-muted/50",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <CategoryMobileSection categories={categoryTree} onClose={onClose} />

          {/* Quick actions */}
          <div className="mt-auto border-t border-border bg-background/60 px-4 py-3.5 max-[480px]:px-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Quick links</p>
              <ThemeToggle />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/account"
                onClick={onClose}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-sm font-medium transition-colors hover:border-secondary/40"
              >
                <User className="h-4 w-4 text-secondary" />
                Account
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="relative flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-sm font-medium transition-colors hover:border-secondary/40"
              >
                <ShoppingBag className="h-4 w-4 text-secondary" />
                Cart
                {cartCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                href="/account/wishlist"
                onClick={onClose}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-sm font-medium transition-colors hover:border-secondary/40"
              >
                <Heart className="h-4 w-4 text-secondary" />
                Wishlist
              </Link>
              <Link
                href="/track-order"
                onClick={onClose}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-sm font-medium transition-colors hover:border-secondary/40"
              >
                <Package className="h-4 w-4 text-secondary" />
                Track order
              </Link>
              <Link
                href="/pages/contact"
                onClick={onClose}
                className="col-span-2 flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-sm font-medium transition-colors hover:border-secondary/40"
              >
                <Mail className="h-4 w-4 text-secondary" />
                Contact
              </Link>
            </div>
          </div>
        </div>
        </nav>
      </MotionDrawer>
    </div>
  );
}
