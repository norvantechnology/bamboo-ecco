"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
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
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({ productId, sku, slug, title, image, price }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <Button
      variant="default"
      size="lg"
      className="group w-full h-13 sm:h-14 rounded-2xl bg-[#1c2416] text-[#FAF8F3] hover:bg-[#26331f] text-sm sm:text-base font-semibold shadow-md hover:shadow-lg hover:shadow-[#1c2416]/20 transition-all duration-300 active:scale-[0.97] border border-[#1c2416] cursor-pointer inline-flex items-center justify-center gap-2.5"
      disabled={disabled}
      onClick={handleAdd}
    >
      {added ? (
        <>
          <Check className="h-5 w-5 shrink-0 text-[#C9A24B] animate-check" />
          <span>Added to Cart</span>
        </>
      ) : (
        <>
          <ShoppingBag className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
          <span>Add to Cart</span>
          <span className="font-sans transition-transform duration-300 group-hover:translate-x-1">→</span>
        </>
      )}
    </Button>
  );
}
