"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useWishlist } from "@/components/wishlist/wishlist-context";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loading";
import { AccountShell } from "@/components/account/account-shell";

export default function WishlistPage() {
  const { items, removeItem } = useWishlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const subtitle = mounted
    ? items.length > 0
      ? `${items.length} saved item${items.length !== 1 ? "s" : ""}`
      : "Items you save will appear here"
    : undefined;

  return (
    <AccountShell title="Wishlist" subtitle={subtitle}>
      {!mounted ? (
        <PageLoader label="Loading wishlist…" />
      ) : items.length === 0 ? (
        <div className="data-card text-center">
          <Heart className="mx-auto h-10 w-10 text-border" />
          <h3 className="mt-4 font-display text-lg">Your wishlist is empty</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Save items you love by tapping the heart on any product.
          </p>
          <Link href="/shop" className="mt-6 inline-block">
            <Button>Browse shop</Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={`${item.productId}-${item.sku}`} className="data-card">
              <div className="flex gap-3 sm:gap-4">
                <Link
                  href={`/product/${item.slug}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-background sm:h-24 sm:w-24"
                >
                  {item.image && (
                    <Image src={item.image} alt={item.title} fill sizes="96px" className="object-cover" />
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                  <div className="min-w-0">
                    <Link href={`/product/${item.slug}`} className="line-clamp-2 text-sm font-medium hover:text-secondary sm:text-base">
                      {item.title}
                    </Link>
                    <p className="mt-0.5 font-numeric text-sm font-semibold sm:mt-1 sm:font-normal sm:text-muted">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/product/${item.slug}`} className="flex-1 sm:flex-none">
                      <Button size="sm" variant="secondary" className="w-full">View</Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => removeItem(item.productId, item.sku)} className="flex-1 sm:flex-none">
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
