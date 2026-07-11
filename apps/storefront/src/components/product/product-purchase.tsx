"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { AddToCartButton } from "./add-to-cart-button";
import { formatPrice, formatVariantSubtitle, cn } from "@/lib/utils";
import type { Product } from "@/lib/api";
import { isProductInStock } from "@/lib/api";

interface Props {
  product: Product;
  defaultImage: string;
}

export function ProductPurchase({ product, defaultImage }: Props) {
  const [selectedSku, setSelectedSku] = useState(product.variants[0]?.sku ?? "");
  const [quantity, setQuantity] = useState(1);
  const variant = product.variants.find((v) => v.sku === selectedSku) ?? product.variants[0];

  if (!variant) return null;

  const inStock = isProductInStock(product, variant.stockQty);
  const maxQty = Math.max(1, variant.stockQty || 1);

  const hasMultiple = product.variants.length > 1;
  const attrKey = hasMultiple
    ? Object.keys(product.variants[0].attributes ?? {})[0] ?? "option"
    : null;

  return (
    <div>
      {hasMultiple && attrKey && (
        <div className="mt-4">
          <p className="text-sm font-semibold capitalize text-muted">{attrKey}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const label =
                formatVariantSubtitle(v.attributes) ??
                Object.values(v.attributes ?? {})[0] ??
                v.sku;
              return (
                <button
                  key={v.sku}
                  type="button"
                  onClick={() => setSelectedSku(v.sku)}
                  className={cn(
                    "min-h-11 rounded-xl border px-4 py-2.5 text-sm font-medium capitalize transition-all duration-300 active:scale-[0.98]",
                    selectedSku === v.sku
                      ? "border-secondary bg-secondary text-white shadow-warm"
                      : "border-border bg-surface hover:border-secondary hover:text-secondary",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5">
        <p className="font-numeric text-3xl font-semibold sm:text-4xl">
          {formatPrice(variant.price, variant.currency)}
        </p>
        <p className="mt-1.5 text-sm font-medium sm:text-base">
          {inStock ? (
            <span className="text-secondary">In stock — {variant.stockQty} available</span>
          ) : (
            <span className="text-red-700">Out of stock</span>
          )}
        </p>
      </div>

      {inStock && (
        <div className="mt-5 flex items-center gap-3">
          <span className="text-sm font-medium text-muted">Quantity</span>
          <div className="flex items-center rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="flex h-11 w-11 items-center justify-center rounded-l-xl transition-transform active:scale-90 active:bg-background disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-base font-medium tabular-nums">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={quantity >= maxQty}
              className="flex h-11 w-11 items-center justify-center rounded-r-xl transition-transform active:scale-90 active:bg-background disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 sm:sticky sm:bottom-4">
        <AddToCartButton
          productId={product._id}
          sku={variant.sku}
          slug={product.slug}
          title={product.title}
          image={defaultImage}
          price={variant.price}
          quantity={quantity}
          disabled={!inStock}
        />
      </div>
    </div>
  );
}
