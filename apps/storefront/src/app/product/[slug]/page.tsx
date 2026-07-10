import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import { getProduct, getRelatedProducts, getProductReviews } from "@/lib/api";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductCard } from "@/components/product/product-card";
import { breadcrumbJsonLd, buildPageMetadata, productJsonLd } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug).catch(() => null);
  const image = product?.images.find((i) => i.type !== "lifestyle") ?? product?.images[0];
  const { optimizeImageUrl } = await import("@/lib/cloudinary");
  const ogImage = image ? optimizeImageUrl(image.url, { width: 1200 }) : undefined;
  return buildPageMetadata({
    title: product?.meta?.title ?? product?.title ?? "Product",
    description: product?.meta?.description ?? product?.description?.slice(0, 160),
    path: `/product/${slug}`,
    image: ogImage,
    imageAlt: image?.alt || product?.title,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, related, reviews] = await Promise.all([
    getProduct(slug).catch(() => null),
    getRelatedProducts(slug).catch(() => []),
    getProductReviews(slug).catch(() => []),
  ]);

  if (!product) notFound();

  const productImages = product.images.filter((i) => i.type !== "lifestyle");
  const image = productImages[0];

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const jsonLd = [
    productJsonLd({
      name: product.title,
      description: product.description,
      images: product.images.map((i) => ({ url: i.url, alt: i.alt })),
      sku: product.variants[0]?.sku,
      price: product.variants[0]?.price,
      currency: product.variants[0]?.currency,
      inStock: (product.variants[0]?.stockQty ?? 0) > 0,
      rating: product.ratingSummary,
      url: `${base}/product/${slug}`,
    }),
    breadcrumbJsonLd([
      { name: "Home", url: base },
      { name: "Shop", url: `${base}/shop` },
      { name: product.title, url: `${base}/product/${slug}` },
    ]),
  ];

  return (
    <div className="container-page py-4 sm:py-10">
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted sm:mb-6 sm:text-sm">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/shop" className="hover:text-foreground">Shop</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="line-clamp-1 text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} title={product.title} model3d={product.model3d} />

        <div className="lg:sticky lg:top-20 lg:self-start">
          <h1 className="font-display text-2xl sm:text-4xl">{product.title}</h1>

          {product.ratingSummary.count > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <StarRating rating={Math.round(product.ratingSummary.avg)} />
              <span className="text-sm text-muted">{product.ratingSummary.avg.toFixed(1)} ({product.ratingSummary.count} reviews)</span>
            </div>
          )}

          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{product.description}</p>

          <ProductPurchase product={product} defaultImage={image?.url ?? ""} />

          {product.specs && (
            <dl className="mt-8 space-y-3 border-t border-border pt-8 text-sm">
              {product.specs.material && (<div><dt className="font-medium">Material</dt><dd className="text-muted">{product.specs.material}</dd></div>)}
              {product.specs.dimensions && (<div><dt className="font-medium">Dimensions</dt><dd className="text-muted">{product.specs.dimensions}</dd></div>)}
              {product.specs.weight && (<div><dt className="font-medium">Weight</dt><dd className="text-muted">{product.specs.weight}</dd></div>)}
              {product.specs.careInstructions && (<div><dt className="font-medium">Care</dt><dd className="text-muted">{product.specs.careInstructions}</dd></div>)}
              {product.specs.shippingInfo && (<div><dt className="font-medium">Shipping</dt><dd className="text-muted">{product.specs.shippingInfo}</dd></div>)}
              {product.specs.warranty && (<div><dt className="font-medium">Warranty</dt><dd className="text-muted">{product.specs.warranty}</dd></div>)}
            </dl>
          )}
        </div>
      </div>

      {reviews.length > 0 && (
        <section className="mt-16 border-t border-border pt-16">
          <h2 className="font-display text-2xl">Customer Reviews</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {reviews.map((review) => (
              <blockquote key={review._id} className="rounded-lg border border-border bg-surface p-6">
                <StarRating rating={review.rating} />
                <p className="mt-2 text-sm">&ldquo;{review.body}&rdquo;</p>
                <cite className="mt-3 block text-sm font-medium not-italic">{review.reviewerName}</cite>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-16 border-t border-border pt-16">
          <h2 className="font-display text-2xl">Related Products</h2>
          <div className="mt-8 product-grid">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
