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
import { MotionReveal } from "@/components/ui/motion-reveal";

interface ProductCardProps {
  product: Product;
  className?: string;
  reveal?: boolean;
  priorityImage?: boolean;
}

export function ProductCard({ product, className, reveal = false, priorityImage = false }: ProductCardProps) {
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

  const cardContent = (
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
          className="relative aspect-[3/4] overflow-hidden bg-[#f0ebe3] dark:bg-[#22201d]"
        >
          {displayImage && (
            <Image
              src={displayImage.url}
              alt={displayImage.alt || product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              quality={75}
              priority={priorityImage}
              loading={priorityImage ? undefined : "lazy"}
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          )}

          {hasDiscount && !outOfStock && (
            <span className="absolute left-2.5 top-2.5 z-[2] rounded-full bg-[#b8863a] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm backdrop-blur-xs sm:left-3 sm:top-3 sm:px-3 sm:text-xs">
              {discountPercent}% OFF
            </span>
          )}

          {outOfStock && (
            <span className="absolute left-2.5 top-2.5 z-[2] rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted backdrop-blur-sm sm:left-3 sm:top-3 sm:px-3 sm:text-xs">
              Sold out
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleWishlistToggle();
            }}
            className="absolute right-2.5 top-2.5 z-[2] flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 text-muted shadow-warm backdrop-blur-sm transition-all duration-300 ease-out hover:scale-110 hover:text-red-500 active:scale-95 sm:right-3 sm:top-3 sm:h-10 sm:w-10"
            aria-label="Add to wishlist"
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors duration-300 ease-out sm:h-[18px] sm:w-[18px]",
                wishlisted ? "fill-red-500 text-red-500" : "fill-none",
                heartPop && "heart-pop",
              )}
            />
          </button>
        </Link>

        <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-5">
          <div className="space-y-1">
            {product.ratingSummary.count > 0 ? (
              <div className="flex items-center gap-1 text-xs font-semibold text-muted">
                <Star className="h-3.5 w-3.5 fill-[#C9A24B] text-[#C9A24B]" />
                <span className="text-foreground">{product.ratingSummary.avg.toFixed(1)}</span>
                <span className="text-muted/80">({product.ratingSummary.count})</span>
              </div>
            ) : null}

            <Link href={`/product/${product.slug}`} className="block">
              <h3 className="line-clamp-2 min-h-[2.5rem] font-sans text-sm font-bold leading-snug tracking-tight text-foreground transition-colors sm:min-h-[2.75rem] sm:text-base group-hover:text-[#b8863a]">
                {product.title}
              </h3>
            </Link>

            {subtitle && (
              <p className="line-clamp-1 text-xs font-medium text-muted/80 sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>

          <div className="mt-3 pt-2 sm:pt-3 border-t border-border/40">
            {variant && (
              <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 mb-2.5">
                <span className="font-numeric text-base font-extrabold leading-none text-foreground sm:text-xl">
                  {formatPrice(variant.price, variant.currency)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="font-numeric text-xs text-muted line-through sm:text-sm">
                      {formatPrice(compareAtPrice, variant.currency)}
                    </span>
                    <span className="text-xs font-bold text-[#8c321d] dark:text-[#c47c6e]">
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
                "group/btn inline-flex w-full h-9 sm:h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold tracking-wide transition-all duration-300 ease-out active:scale-[0.97] shadow-xs cursor-pointer",
                added
                  ? "bg-[#4A5D3E] text-white animate-add-pop shadow-md"
                  : "bg-[#1c2416] text-[#FAF8F3] hover:bg-[#26331f] hover:shadow-md hover:shadow-[#1c2416]/15 lg:opacity-0 lg:group-hover:opacity-100",
                outOfStock && "cursor-not-allowed opacity-50 bg-muted text-muted-foreground",
              )}
            >
              {added ? (
                <>
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-check shrink-0 text-[#FAF8F3]" />
                  <span>Added to Cart</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span>Add to Cart</span>
                  <span className="font-sans transition-transform duration-300 group-hover/btn:translate-x-1">→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );

  if (reveal) {
    return <MotionReveal className="h-full">{cardContent}</MotionReveal>;
  }

  return cardContent;
}
