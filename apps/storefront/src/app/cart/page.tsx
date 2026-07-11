"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-page py-12 text-center sm:py-16">
        <h1 className="font-display text-2xl sm:text-3xl">Your cart is empty</h1>
        <p className="mt-3 text-sm text-muted sm:text-base">Discover handcrafted bamboo pieces for your home.</p>
        <Link href="/shop" className="mt-8 inline-block">
          <Button>Continue shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-6 sm:py-12">
      <h1 className="font-display text-2xl sm:text-4xl">Shopping Cart</h1>
      <p className="mt-1 text-sm text-muted">{items.length} item{items.length !== 1 ? "s" : ""}</p>

      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[1fr_340px] lg:gap-10">
        <ul className="space-y-3 sm:space-y-4">
          {items.map((item) => (
            <li
              key={`${item.productId}-${item.sku}`}
              className="data-card !p-3 sm:!p-4"
            >
              <div className="flex gap-3 sm:gap-4">
                <Link
                  href={`/product/${item.slug}`}
                  className="relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-background sm:h-24 sm:w-24"
                >
                  {item.image && (
                    <Image src={item.image} alt={item.title} fill sizes="96px" className="object-cover" />
                  )}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${item.slug}`}
                        className="line-clamp-2 text-sm font-medium hover:text-secondary sm:text-base"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-1 text-sm text-muted">{formatPrice(item.price)}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold sm:text-base">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center rounded-xl border border-border">
                      <button
                        type="button"
                        className="flex h-11 w-11 items-center justify-center rounded-l-xl transition-transform active:scale-90 active:bg-background"
                        onClick={() => updateQuantity(item.productId, item.sku, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-base font-medium tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        className="flex h-11 w-11 items-center justify-center rounded-r-xl transition-transform active:scale-90 active:bg-background"
                        onClick={() => updateQuantity(item.productId, item.sku, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId, item.sku)}
                      className="flex min-h-11 items-center gap-2 rounded-lg px-3.5 text-sm font-medium text-muted transition-transform hover:bg-background hover:text-red-700 active:scale-[0.97]"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="data-card h-fit lg:sticky lg:top-24">
          <h2 className="font-display text-lg sm:text-xl">Order summary</h2>
          <div className="data-row mt-4">
            <span className="label">Subtotal</span>
            <span className="value">{formatPrice(subtotal)}</span>
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <p className="text-xs text-muted">Shipping calculated at checkout</p>
          </div>
          <Link href="/checkout" className="mt-5 block sm:mt-6">
            <Button variant="secondary" className="w-full rounded-xl">Proceed to checkout</Button>
          </Link>
          <Link
            href="/shop"
            className="mt-3 block rounded-lg py-2 text-center text-sm font-medium text-muted transition-transform hover:text-secondary active:scale-[0.98]"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
