"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star, ShoppingBag, Check } from "lucide-react";
import { loadGsap } from "@/lib/gsap";
import { formatPrice, cn, getProductCardSubtitle } from "@/lib/utils";
import type { Product } from "@/lib/api";
import { useCart } from "@/components/cart/cart-context";
import { useWishlist } from "@/components/wishlist/wishlist-context";
import { WoodFrame } from "@/components/animation/wood-grain";
import { prefersReducedMotion } from "@/lib/motion";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const [heartPop, setHeartPop] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const productImages = product.images.filter((i) => i.type !== "lifestyle");
  const hoverImage = product.images.find((i) => i.type === "lifestyle") ?? productImages[1];
  const image = productImages[0];
  const variant = product.variants[0];
  const outOfStock = !variant || variant.stockQty === 0;
  const subtitle = getProductCardSubtitle(product);

  const displayImage = hovered && hoverImage ? hoverImage : image;

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || prefersReducedMotion()) return;
    let cancelled = false;
    loadGsap().then((gsap) => {
      if (cancelled || !innerRef.current) return;
      gsap.set(innerRef.current, { transformPerspective: 1000, transformStyle: "preserve-3d" });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleTilt(e: React.MouseEvent) {
    const card = cardRef.current;
    const inner = innerRef.current;
    if (!card || !inner || prefersReducedMotion()) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    void loadGsap().then((gsap) => {
      gsap.to(inner, {
        rotateY: x * 8,
        rotateX: -y * 8,
        duration: 0.4,
        ease: "power2.out",
      });
    });
  }

  function resetTilt() {
    const inner = innerRef.current;
    if (!inner || prefersReducedMotion()) return;
    void loadGsap().then((gsap) => {
      gsap.to(inner, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.65,
        ease: "power3.out",
      });
    });
  }

  const wishlisted = variant ? isWishlisted(product._id, variant.sku) : false;

  function handleWishlistToggle() {
    if (!variant) return;
    toggle({
      productId: product._id,
      sku: variant.sku,
      slug: product.slug,
      title: product.title,
      image: image?.url ?? "",
      price: variant.price,
    });
    setHeartPop(true);
    window.setTimeout(() => setHeartPop(false), 350);
  }
  function handleQuickAdd() {
    if (!variant || outOfStock) return;
    addItem({
      productId: product._id,
      sku: variant.sku,
      slug: product.slug,
      title: product.title,
      image: image?.url ?? "",
      price: variant.price,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <article
      ref={cardRef}
      data-product-card-3d
      className={cn("group flex h-full flex-col", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        resetTilt();
      }}
      onMouseMove={handleTilt}
    >
      <div
        ref={innerRef}
        className="product-card-inner preserve-3d flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-warm sm:rounded-2xl"
      >
        <WoodFrame />

        <Link
          href={`/product/${product.slug}`}
          className="relative aspect-[4/5] overflow-hidden bg-[#f0ebe3]"
        >
          {displayImage && (
            <Image
              src={displayImage.url}
              alt={displayImage.alt}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          )}
          <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#2a2622]/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 lg:group-hover:opacity-100" />

          {outOfStock && (
            <span className="absolute left-2 top-2 z-[2] rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted backdrop-blur-sm sm:left-3 sm:top-3 sm:px-3 sm:text-xs">
              Sold out
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleWishlistToggle();
            }}
            className="absolute right-1.5 top-1.5 z-[2] flex h-8 w-8 items-center justify-center rounded-full bg-surface/95 text-muted shadow-warm backdrop-blur-sm transition-all duration-300 ease-out hover:scale-110 hover:text-secondary active:scale-95 sm:right-3 sm:top-3 sm:h-11 sm:w-11"
            aria-label="Add to wishlist"
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors duration-300 ease-out sm:h-[18px] sm:w-[18px]",
                wishlisted ? "fill-secondary text-secondary" : "fill-none",
                heartPop && "heart-pop",
              )}
            />
          </button>
        </Link>

        <div className="flex flex-1 flex-col gap-0.5 p-2 sm:gap-1.5 sm:p-4">
          {product.ratingSummary.count > 0 ? (
            <div className="flex items-center gap-0.5 text-[11px] font-medium text-muted sm:gap-1 sm:text-sm">
              <Star className="h-3 w-3 fill-gold text-gold sm:h-3.5 sm:w-3.5" />
              <span className="text-foreground">{product.ratingSummary.avg.toFixed(1)}</span>
              <span className="text-muted">({product.ratingSummary.count})</span>
            </div>
          ) : null}

          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="line-clamp-2 font-display text-[0.8125rem] font-semibold leading-snug transition-colors sm:text-base lg:group-hover:text-wood">
              {product.title}
            </h3>
          </Link>

          {subtitle && (
            <p className="line-clamp-1 break-words text-[11px] font-medium leading-snug text-muted sm:line-clamp-2 sm:text-sm">
              {subtitle}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between gap-1.5 pt-1.5 sm:gap-3 sm:pt-3">
            {variant && (
              <span className="font-numeric text-sm font-semibold leading-none sm:text-lg">
                {formatPrice(variant.price, variant.currency)}
              </span>
            )}
            <button
              type="button"
              disabled={outOfStock}
              onClick={handleQuickAdd}
              className={cn(
                "inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] sm:h-10 sm:gap-2 sm:rounded-full sm:px-4 sm:text-sm",
                added
                  ? "bg-secondary text-white"
                  : "border border-border bg-background text-foreground sm:bg-transparent lg:opacity-0 lg:group-hover:opacity-100 lg:hover:border-secondary lg:hover:bg-secondary lg:hover:text-white",
                outOfStock && "cursor-not-allowed opacity-40",
              )}
            >
              {added ? (
                <>
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="sm:hidden">Add</span>
                  <span className="hidden sm:inline">Quick add</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
