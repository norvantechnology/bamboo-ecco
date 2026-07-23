"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Display structured loading skeleton to prevent hydration flashes
  if (!mounted) {
    return (
      <div className="container-page max-w-[1440px] mx-auto py-8 sm:py-16">
        <div className="h-8 w-44 animate-pulse rounded bg-border/80" />
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px] lg:gap-10">
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 w-full animate-pulse rounded-2xl bg-[#FAF8F5]/5 border border-border/40" />
            ))}
          </div>
          <div className="h-64 w-full animate-pulse rounded-2xl bg-[#FAF8F5]/5 border border-border/40" />
        </div>
      </div>
    );
  }

  // Elegant empty cart state
  if (items.length === 0) {
    return (
      <div className="container-page max-w-xl mx-auto py-16 text-center flex flex-col items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#4A5D3E] to-[#C9A24B]/70 text-white shadow-md mb-6">
          <ShoppingBag className="h-7 w-7 text-[#FAF8F5]" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl text-foreground font-semibold">Your cart is empty</h1>
        <p className="mt-3 text-sm text-muted max-w-xs sm:text-base leading-relaxed">
          Discover beautiful handcrafted bamboo lamps, furniture, and sustainable home decor items.
        </p>
        <Link href="/shop" className="mt-8 w-full sm:w-auto">
          <Button className="w-full sm:w-auto bg-[#4A5D3E] hover:bg-[#3D4D33] text-white rounded-xl px-8 py-3 shadow-md transition-all active:scale-[0.97]">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  // Regional shipping calculations (free shipping over ₹1,999)
  const isFreeShipping = subtotal > 1999;
  const shippingCost = isFreeShipping ? 0 : 150;
  const estGst = Math.round(subtotal * 0.18); // 18% included GST
  const grandTotal = subtotal + shippingCost;

  return (
    <div className="container-page max-w-[1440px] mx-auto py-6 sm:py-12">
      <h1 className="font-display text-2xl sm:text-4xl text-foreground">Shopping Cart</h1>
      <p className="mt-1 text-sm text-muted">{items.length} item{items.length !== 1 ? "s" : ""}</p>

      {/* 2-Column Responsive Layout */}
      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px] lg:gap-10">
        
        {/* Left Column: Cart Items list with layout entry and exit transition animations */}
        <div>
          <ul className="space-y-4">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={`${item.productId}-${item.sku}`}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{
                    opacity: 0,
                    x: -60,
                    height: 0,
                    marginTop: 0,
                    marginBottom: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                    border: 0,
                    overflow: "hidden"
                  }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="relative rounded-2xl border border-border/50 bg-[#FAF8F5]/5 p-4 sm:p-5 shadow-warm hover:shadow-warm-md transition-all duration-300"
                >
                  <div className="flex gap-4 sm:gap-5">
                    {/* Item Image */}
                    <Link
                      href={`/product/${item.slug}`}
                      className="relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-[#FAF8F5]/10 sm:h-24 sm:w-24 shadow-sm"
                    >
                      {item.image && (
                        <Image src={item.image} alt={item.title} fill sizes="96px" className="object-cover" />
                      )}
                    </Link>

                    {/* Details section */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      {/* Name, price & total */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/product/${item.slug}`}
                            className="line-clamp-2 text-sm font-semibold hover:text-secondary sm:text-base text-foreground"
                          >
                            {item.title}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-xs text-muted font-medium">{formatPrice(item.price)} each</span>
                            <span className="text-xs text-muted/40 line-through font-normal">{formatPrice(item.price * 1.3)}</span>
                          </div>
                        </div>
                        <p className="shrink-0 text-sm font-bold text-foreground sm:text-base">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>

                      {/* Quantity control and remove action */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        {/* Custom 40x40px touch buttons with micro-animations */}
                        <div className="flex items-center rounded-xl border border-border/80 bg-background shadow-inner">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            className="flex h-10 w-10 items-center justify-center rounded-l-xl text-muted hover:text-foreground active:bg-[#FAF8F5]/5"
                            onClick={() => updateQuantity(item.productId, item.sku, item.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </motion.button>
                          
                          <span className="w-10 text-center text-sm font-semibold tabular-nums text-foreground">{item.quantity}</span>
                          
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            className="flex h-10 w-10 items-center justify-center rounded-r-xl text-muted hover:text-foreground active:bg-[#FAF8F5]/5"
                            onClick={() => updateQuantity(item.productId, item.sku, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </motion.button>
                        </div>

                        {/* Remove with micro-interaction feedback */}
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => removeItem(item.productId, item.sku)}
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        {/* Right Column: Sticky Order Summary Card */}
        <aside className="relative">
          <div
            className={cn(
              "sticky top-24 rounded-2xl border border-border/80 bg-[#FAF8F5]/5 p-6 transition-all duration-300",
              isScrolled ? "shadow-xl border-border" : "shadow-md"
            )}
          >
            <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">Order summary</h2>
            
            <div className="mt-5 space-y-3.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted">Shipping</span>
                {isFreeShipping ? (
                  <span className="text-emerald-600 font-semibold uppercase text-xs tracking-wider">Free Shipping</span>
                ) : (
                  <span className="font-semibold text-foreground">{formatPrice(shippingCost)}</span>
                )}
              </div>

              <div className="flex justify-between text-xs text-muted/70">
                <span>Estimated GST (18% included)</span>
                <span>{formatPrice(estGst)}</span>
              </div>

              <div className="border-t border-border pt-4 mt-2 flex justify-between items-baseline">
                <span className="text-base font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-foreground tracking-tight">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-border/60 pt-3">
              <p className="text-xs text-muted leading-relaxed">
                Taxes and free regional shipping promotions are pre-applied above.
              </p>
            </div>

            <Link href="/checkout" className="mt-6 block">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                className="w-full inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#4A5D3E] to-[#C9A24B] text-sm font-semibold text-white shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                Proceed to checkout
              </motion.button>
            </Link>

            <Link
              href="/shop"
              className="mt-4 block text-center text-xs font-semibold text-muted hover:text-foreground transition-colors duration-200"
            >
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
