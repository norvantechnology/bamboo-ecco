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
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
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

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
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
          {/* Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#121c10] via-[#1a2618] to-[#121c10] px-4.5 pb-5 pt-4 text-[#f2ede0] border-b border-[#e4c98f]/25 shadow-md rounded-b-2xl sm:px-5 sm:pb-6 sm:pt-5">
            <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-[#C9A24B]/10 blur-3xl" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#e4c98f]/25 bg-black/40 text-[#f2ede0] backdrop-blur-sm transition-all hover:bg-black/70 active:scale-95 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <Link href="/" onClick={onClose} className="relative block pr-12">
              <BrandLogo storeName={storeName} variant="dark" size="md" />
              <p className="mt-2 truncate text-xs font-medium leading-snug text-[#f2ede0]/80 sm:text-sm font-sans">
                {tagline || "Handcrafted Bamboo Home Decor, Lamps & Furniture"}
              </p>
            </Link>
            <Link
              href="/shop"
              onClick={onClose}
              className="group relative mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#b8863a] px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#a07430] hover:shadow-lg hover:shadow-[#b8863a]/25 active:scale-[0.97]"
            >
              <Package className="h-4 w-4 shrink-0" />
              <span>Shop All Bamboo Decor</span>
              <span className="font-sans transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto overscroll-contain">
            {/* Search Bar Shortcut */}
            <Link
              href="/search"
              onClick={onClose}
              className="mx-3.5 mt-3.5 flex items-center gap-3 rounded-xl border border-border/80 bg-surface/90 px-4 py-3 text-muted shadow-xs transition-colors hover:border-[#b8863a]/40 hover:bg-surface-elevated"
            >
              <Search className="h-4.5 w-4.5 shrink-0 text-[#b8863a]" />
              <span className="text-sm font-medium text-muted">Search 33+ handcrafted decor items…</span>
            </Link>

            {/* Primary links */}
            <div className="px-3.5 py-3">
              <p className="px-1.5 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Explore Store</p>
              <ul className="space-y-1">
                {primaryNav.map((link, i) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <li
                      key={link.href}
                      className={cn(
                        "transition-all duration-300",
                        open ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0",
                      )}
                      style={{ transitionDelay: open ? `${80 + i * 35}ms` : "0ms" }}
                    >
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 border border-transparent",
                          active
                            ? "bg-secondary/15 text-foreground border-secondary/20 font-semibold shadow-xs"
                            : "hover:bg-surface-elevated hover:border-border/60 active:scale-[0.98]",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                            active
                              ? "border-secondary/30 bg-secondary/20 text-secondary"
                              : "border-border/80 bg-background text-muted group-hover:border-[#b8863a]/30 group-hover:text-[#b8863a]",
                          )}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-sans text-sm font-bold leading-snug text-foreground sm:text-base group-hover:text-[#b8863a] transition-colors">{link.label}</span>
                          <span className="block text-xs font-medium text-muted/80">{link.description}</span>
                        </span>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5",
                            active ? "text-secondary" : "text-muted/40",
                          )}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <CategoryMobileSection categories={categoryTree} onClose={onClose} />

            {/* Quick Actions & Account */}
            <div className="mt-auto border-t border-border/80 bg-background/80 px-3.5 py-4">
              <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Quick Access</p>
                <ThemeToggle />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/account"
                  onClick={onClose}
                  className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground transition-all hover:border-[#b8863a]/40 shadow-xs"
                >
                  <User className="h-4 w-4 text-[#b8863a]" />
                  Account
                </Link>
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="relative flex items-center gap-2.5 rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground transition-all hover:border-[#b8863a]/40 shadow-xs"
                >
                  <ShoppingBag className="h-4 w-4 text-[#b8863a]" />
                  Cart
                  {cartCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#b8863a] px-1 text-[10px] font-bold text-white shadow-xs">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/account/wishlist"
                  onClick={onClose}
                  className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground transition-all hover:border-[#b8863a]/40 shadow-xs"
                >
                  <Heart className="h-4 w-4 text-red-500" />
                  Wishlist
                </Link>
                <Link
                  href="/track-order"
                  onClick={onClose}
                  className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground transition-all hover:border-[#b8863a]/40 shadow-xs"
                >
                  <Package className="h-4 w-4 text-emerald-600" />
                  Track order
                </Link>
                <Link
                  href="/pages/contact"
                  onClick={onClose}
                  className="col-span-2 flex items-center gap-2.5 rounded-xl border border-border/80 bg-surface px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-foreground transition-all hover:border-[#b8863a]/40 shadow-xs"
                >
                  <Mail className="h-4 w-4 text-[#b8863a]" />
                  Need Help? Contact Us
                </Link>
              </div>

              {/* Free Shipping Promo Pill */}
              <div className="mt-3.5 rounded-xl border border-[#C9A24B]/30 bg-[#C9A24B]/10 p-2.5 text-center text-[11px] font-semibold text-[#b8863a] shadow-xs">
                🌿 Free Pan-India Delivery on orders over ₹1,999
              </div>
            </div>
          </div>
        </nav>
      </MotionDrawer>
    </div>
  );
}
