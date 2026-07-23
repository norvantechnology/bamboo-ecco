"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star, ShoppingBag, Check } from "lucide-react";
import { loadGsap, type GsapModule } from "@/lib/gsap";
import { formatPrice, cn, getProductCardSubtitle } from "@/lib/utils";
import type { Product } from "@/lib/api";
import { pickBestImage, pickThumbnailImage } from "@/lib/pick-best-image";
import { useCart } from "@/components/cart/cart-context";
import { useWishlist } from "@/components/wishlist/wishlist-context";
import { WoodFrame } from "@/components/animation/wood-grain";
import { prefersReducedMotion } from "@/lib/motion";

interface ProductCardProps {
  product: Product;
  className?: string;
  reveal?: boolean;
}

export function ProductCard({ product, className, reveal = false }: ProductCardProps) {
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const [hovered, setHovered] = useState(false);
  const [added, setAdded] = useState(false);
  const [heartPop, setHeartPop] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const image = pickThumbnailImage(product.images);
  const hoverImage =
    pickBestImage(product.images, "lifestyle") ??
    pickBestImage(
      product.images?.filter((i) => i.url !== image?.url),
      "product",
    );
  const variant = product.variants[0];
  const outOfStock =
    product.status === "out_of_stock" || !variant || variant.stockQty === 0;
  const subtitle = getProductCardSubtitle(product);
  const compareAtPrice = variant?.compareAtPrice;
  const hasDiscount = !!(compareAtPrice && compareAtPrice > variant.price);
  const discountPercent = hasDiscount ? Math.round(((compareAtPrice - variant.price) / compareAtPrice) * 100) : 0;

  const displayImage = hovered && hoverImage && hoverImage.url !== image?.url ? hoverImage : image;

  const gsapRef = useRef<GsapModule | null>(null);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || prefersReducedMotion()) return;
    let cancelled = false;
    loadGsap().then((gsap) => {
      if (cancelled) return;
      gsapRef.current = gsap;
      gsap.set(inner, { transformPerspective: 1000, transformStyle: "preserve-3d" });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleTilt(e: React.MouseEvent) {
    const card = cardRef.current;
    const inner = innerRef.current;
    const gsap = gsapRef.current;
    if (!card || !inner || !gsap || prefersReducedMotion()) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(inner, {
      rotateY: x * 8,
      rotateX: -y * 8,
      duration: 0.4,
      ease: "power2.out",
    });
  }

  function resetTilt() {
    const inner = innerRef.current;
    const gsap = gsapRef.current;
    if (!inner || !gsap || prefersReducedMotion()) return;
    gsap.to(inner, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.65,
      ease: "power3.out",
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
      data-scroll-reveal={reveal ? "true" : undefined}
      className={cn(reveal && "scroll-reveal", "group flex h-full flex-col", className)}
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
          className="relative aspect-[3/4] overflow-hidden bg-[#f0ebe3] dark:bg-[#22201d]"
        >
          {displayImage && (
            <Image
              src={displayImage.url}
              alt={displayImage.alt}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              quality={75}
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          )}

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
            className="absolute right-2.5 top-2.5 z-[2] flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 text-muted shadow-warm backdrop-blur-sm transition-all duration-300 ease-out hover:scale-110 hover:text-secondary active:scale-95 sm:right-3 sm:top-3 sm:h-11 sm:w-11"
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
            <h3 className="line-clamp-2 min-h-[2.25rem] font-display text-[0.8125rem] font-semibold leading-snug transition-colors sm:min-h-[2.75rem] sm:text-base lg:group-hover:text-wood">
              {product.title}
            </h3>
          </Link>

          {subtitle && (
            <p className="hidden sm:block line-clamp-1 break-words text-[11px] font-medium leading-snug text-muted sm:line-clamp-2 sm:text-sm">
              {subtitle}
            </p>
          )}

          <div className="mt-auto pt-2 sm:pt-3">
            {variant && (
              <div className="flex flex-wrap items-baseline gap-1 sm:gap-1.5">
                <span className="font-numeric text-sm font-semibold leading-none text-foreground sm:text-lg">
                  {formatPrice(variant.price, variant.currency)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="font-numeric text-[11px] text-muted line-through sm:text-xs">
                      {formatPrice(compareAtPrice, variant.currency)}
                    </span>
                    <span className="text-[10px] font-bold text-[#8c321d] dark:text-[#c47c6e] sm:text-xs">
                      ({discountPercent}% Off)
                    </span>
                  </>
                )}
              </div>
            )}
            
            <button
              type="button"
              disabled={outOfStock}
              onClick={handleQuickAdd}
              className={cn(
                "mt-2 inline-flex w-full h-8 sm:h-10 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ease-out active:scale-[0.97]",
                added
                  ? "bg-secondary text-white animate-add-pop"
                  : "bg-[#8b5e34] text-white hover:bg-[#a0713f] lg:opacity-0 lg:group-hover:opacity-100",
                outOfStock && "cursor-not-allowed opacity-40",
              )}
            >
              {added ? (
                <>
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-check" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Add to cart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
