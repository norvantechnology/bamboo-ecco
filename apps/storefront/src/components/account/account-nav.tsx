"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Orders", match: (path: string) => path === "/account" || path.startsWith("/account/orders") },
  { href: "/account/wishlist", label: "Wishlist", match: (path: string) => path.startsWith("/account/wishlist") },
  { href: "/account/track", label: "Track order", match: (path: string) => path.startsWith("/account/track") },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-none sm:mx-0 sm:flex-col sm:gap-1 sm:overflow-visible sm:pb-0">
      {links.map((link) => {
        const active = link.match(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "motion-tab shrink-0 rounded-full px-4 py-2 text-sm font-medium sm:rounded-lg sm:px-3",
              active
                ? "bg-primary text-surface"
                : "bg-background text-muted hover:bg-surface hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
