"use client";

import { useState } from "react";
import { AddToCartButton } from "./add-to-cart-button";
import { formatPrice, formatVariantSubtitle, cn } from "@/lib/utils";
import type { Product } from "@/lib/api";

interface Props {
  product: Product;
  defaultImage: string;
}

export function ProductPurchase({ product, defaultImage }: Props) {
  const [selectedSku, setSelectedSku] = useState(product.variants[0]?.sku ?? "");
  const variant = product.variants.find((v) => v.sku === selectedSku) ?? product.variants[0];

  if (!variant) return null;

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

      <p className="mt-5 font-numeric text-3xl font-semibold sm:text-4xl">
        {formatPrice(variant.price, variant.currency)}
      </p>

      <p className="mt-3 text-base font-medium">
        {variant.stockQty > 0 ? (
          <span className="text-secondary">In stock — {variant.stockQty} available</span>
        ) : (
          <span className="text-red-700">Out of stock</span>
        )}
      </p>

      <div className="mt-6 sm:sticky sm:bottom-4">
        <AddToCartButton
          productId={product._id}
          sku={variant.sku}
          slug={product.slug}
          title={product.title}
          image={defaultImage}
          price={variant.price}
          disabled={variant.stockQty === 0}
        />
      </div>
    </div>
  );
}
