import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import { getProduct, getProductCategory, getRelatedProducts, getProductReviews } from "@/lib/api";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductPurchase } from "@/components/product/product-purchase";
import { ProductCard } from "@/components/product/product-card";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { ProductJsonLd } from "@/components/seo/product-json-ld";
import { absoluteUrl, buildProductMetadata, noIndexMetadata } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug).catch(() => null);
  if (!product) {
    return { ...noIndexMetadata, title: "Product not found" };
  }
  const category = getProductCategory(product);
  return buildProductMetadata({
    title: product.title,
    slug: product.slug,
    description: product.description,
    meta: product.meta,
    images: product.images,
    variants: product.variants,
    status: product.status,
    categoryName: category?.name,
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
  const productUrl = absoluteUrl(`/product/${slug}`);
  const category = getProductCategory(product);
  const parent =
    category?.parentId && typeof category.parentId === "object" ? category.parentId : null;
  const { resolveSiteSeo } = await import("@/lib/site");
  const seo = await resolveSiteSeo();

  const crumbItems = [
    { name: "Home", url: absoluteUrl("/") },
    { name: "Shop", url: absoluteUrl("/shop") },
    ...(parent
      ? [{ name: parent.name, url: absoluteUrl(`/collections/${parent.slug}`) }]
      : []),
    ...(category
      ? [{ name: category.name, url: absoluteUrl(`/collections/${category.slug}`) }]
      : []),
    { name: product.title, url: productUrl },
  ];

  return (
    <div className="container-page min-w-0 overflow-x-hidden py-4 sm:py-10">
      <ProductJsonLd
        name={product.meta?.title || product.title}
        description={product.meta?.description || product.description}
        images={product.images.map((i) => ({ url: i.url, alt: i.alt }))}
        sku={product.variants[0]?.sku}
        price={product.variants[0]?.price}
        currency={product.variants[0]?.currency}
        inStock={
          product.status !== "out_of_stock" && (product.variants[0]?.stockQty ?? 0) > 0
        }
        rating={product.ratingSummary}
        url={productUrl}
        brandName={seo.name || undefined}
        categoryName={category?.name}
        material={product.specs?.material}
      />
      <BreadcrumbJsonLd items={crumbItems} />

      <nav className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] text-muted sm:mb-6 sm:gap-x-2 sm:text-sm">
        <Link href="/" className="-mx-1 rounded px-1 py-1 hover:text-foreground active:text-foreground">Home</Link>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
        <Link href="/shop" className="rounded px-1 py-1 hover:text-foreground active:text-foreground">Shop</Link>
        {parent && (
          <>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
            <Link href={`/collections/${parent.slug}`} className="rounded px-1 py-1 hover:text-foreground active:text-foreground">
              {parent.name}
            </Link>
          </>
        )}
        {category && (
          <>
            <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
            <Link href={`/collections/${category.slug}`} className="rounded px-1 py-1 hover:text-foreground active:text-foreground">
              {category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
        <span className="line-clamp-1 min-w-0 px-1 py-1 text-foreground">{product.title}</span>
      </nav>

      <div className="grid min-w-0 gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="min-w-0">
          <ProductGallery images={product.images} title={product.title} model3d={product.model3d} />
        </div>

        <div className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <h1 className="break-words font-display text-2xl sm:text-4xl">{product.title}</h1>

          {product.ratingSummary.count > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <StarRating rating={Math.round(product.ratingSummary.avg)} />
              <span className="text-sm text-muted">{product.ratingSummary.avg.toFixed(1)} ({product.ratingSummary.count} reviews)</span>
            </div>
          )}

          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{product.description}</p>

          <ProductPurchase product={product} defaultImage={image?.url ?? ""} />

          {product.specs && (
            <dl className="mt-6 divide-y divide-border border-t-2 border-border/70 pt-5 text-sm sm:mt-8 sm:pt-6">
              {product.specs.material && (<div className="flex items-start justify-between gap-4 py-2"><dt className="shrink-0 text-muted">Material</dt><dd className="text-right font-medium text-foreground">{product.specs.material}</dd></div>)}
              {product.specs.dimensions && (<div className="flex items-start justify-between gap-4 py-2"><dt className="shrink-0 text-muted">Dimensions</dt><dd className="text-right font-medium text-foreground">{product.specs.dimensions}</dd></div>)}
              {product.specs.weight && (<div className="flex items-start justify-between gap-4 py-2"><dt className="shrink-0 text-muted">Weight</dt><dd className="text-right font-medium text-foreground">{product.specs.weight}</dd></div>)}
              {product.specs.careInstructions && (<div className="flex items-start justify-between gap-4 py-2"><dt className="shrink-0 text-muted">Care</dt><dd className="text-right font-medium text-foreground">{product.specs.careInstructions}</dd></div>)}
              {product.specs.shippingInfo && (<div className="flex items-start justify-between gap-4 py-2"><dt className="shrink-0 text-muted">Shipping</dt><dd className="text-right font-medium text-foreground">{product.specs.shippingInfo}</dd></div>)}
              {product.specs.warranty && (<div className="flex items-start justify-between gap-4 py-2"><dt className="shrink-0 text-muted">Warranty</dt><dd className="text-right font-medium text-foreground">{product.specs.warranty}</dd></div>)}
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
    </div>
  );
}
