"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";

interface AddToCartButtonProps {
  productId: string;
  sku: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  quantity?: number;
  disabled?: boolean;
}

export function AddToCartButton({
  productId,
  sku,
  slug,
  title,
  image,
  price,
  quantity = 1,
  disabled,
}: AddToCartButtonProps) {
  const { addItem } = useCart();

  return (
    <Button
      variant="secondary"
      size="lg"
      className="w-full rounded-xl sm:rounded-lg"
      disabled={disabled}
      onClick={() => addItem({ productId, sku, slug, title, image, price }, quantity)}
    >
      Add to cart
    </Button>
  );
}
