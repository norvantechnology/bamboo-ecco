"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Menu, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart/cart-context";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CategoryMegaMenu } from "@/components/layout/category-nav";
import type { Category } from "@/lib/api";

const SearchDialog = dynamic(
  () => import("@/components/layout/search-dialog").then((m) => ({ default: m.SearchDialog })),
  { ssr: false },
);

const MobileNav = dynamic(
  () => import("@/components/layout/mobile-nav").then((m) => ({ default: m.MobileNav })),
  { ssr: false },
);

interface HeaderProps {
  storeName: string;
  tagline?: string;
  categoryTree: Category[];
}

const staticNav = [
  { href: "/new-arrivals", label: "New" },
  { href: "/best-sellers", label: "Bestsellers" },
  { href: "/guides", label: "Guides" },
  { href: "/journal", label: "Journal" },
];

function HeaderIconLink({
  href,
  label,
  children,
  badge,
  className,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  badge?: number;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "nav-icon-btn relative flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-secondary",
        className,
      )}
      aria-label={label}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-surface bg-secondary px-1 text-[10px] font-bold leading-none text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function Header({ storeName, tagline, categoryTree }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          scrolled
            ? "border-border/80 bg-surface/95 shadow-warm backdrop-blur-lg"
            : "border-transparent bg-background/90 backdrop-blur-md",
        )}
      >
        <div className="container-page flex h-12 items-center gap-1 sm:h-16 sm:gap-3 lg:gap-6">
          {/* Mobile menu */}
          <button
            type="button"
            className={cn(
              "touch-target -ml-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200 lg:hidden",
              menuOpen
                ? "bg-secondary/10 text-secondary"
                : "text-foreground hover:bg-background",
            )}
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu className="h-5 w-5 stroke-[2.25]" />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="min-w-0 flex-1 truncate text-center font-display text-xl font-semibold tracking-tight transition-colors hover:text-secondary sm:text-2xl lg:flex-none lg:text-left lg:text-3xl"
          >
            {storeName}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden flex-1 items-center justify-center gap-6 xl:gap-8 lg:flex">
            <CategoryMegaMenu categories={categoryTree} />
            {staticNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-base font-medium text-muted transition-colors duration-200 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action icons */}
          <div className="-mr-1.5 flex shrink-0 items-center gap-0 rounded-xl border border-transparent bg-transparent p-0 shadow-none sm:-mr-0 sm:gap-1 sm:border-border/70 sm:bg-surface/80 sm:p-1 sm:shadow-warm">
            <SearchDialog />
            <ThemeToggle />
            <HeaderIconLink href="/account" label="Account" className="hidden sm:flex">
              <User className="icon-brand" />
            </HeaderIconLink>
            <HeaderIconLink href="/cart" label="Cart" badge={count}>
              <ShoppingBag className="icon-brand" />
            </HeaderIconLink>
          </div>
        </div>
      </header>

      {menuOpen && (
        <MobileNav
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          storeName={storeName}
          tagline={tagline}
          categoryTree={categoryTree}
          cartCount={count}
        />
      )}
    </>
  );
}
