import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { CategoryToolbar } from "@/components/category/category-toolbar";
import { InfiniteProductGrid } from "@/components/product/infinite-product-grid";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import { getCategory, getProductsByCategorySlug } from "@/lib/api";
import { absoluteUrl, buildPageMetadata, collectionPageJsonLd } from "@/lib/seo";
import { resolveSiteSeo } from "@/lib/site";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

const VALID_SORTS = ["newest", "price-asc", "price-desc", "rating"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [category, productsResult] = await Promise.all([
    getCategory(slug).catch(() => null),
    getProductsByCategorySlug(slug, 1, "newest").catch(() => null),
  ]);
  if (!category) return { title: "Category Not Found" };
  const title = category.meta?.title || category.name;
  const description = category.meta?.description || undefined;
  const keywords = category.meta?.keywords || undefined;

  const productImages = (productsResult?.data ?? []).flatMap((p) => (p.images ?? []).map((i) => i.url)).filter(Boolean);
  const categoryImages = Array.from(
    new Set([category.imageUrl, ...productImages].filter((u): u is string => Boolean(u && u.trim())))
  ).slice(0, 16);

  return buildPageMetadata({
    title,
    description,
    keywords,
    path: `/collections/${slug}`,
    image: category.imageUrl || productImages[0],
    images: categoryImages.length ? categoryImages : undefined,
    imageAlt: category.name,
  });
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const sortParam = sp.sort ?? "newest";
  const sort = VALID_SORTS.includes(sortParam as (typeof VALID_SORTS)[number])
    ? (sortParam as (typeof VALID_SORTS)[number])
    : "newest";

  const category = await getCategory(slug).catch(() => null);
  if (!category) notFound();

  const parentSlug = category.parent?.slug;

  const [result, parentCategory, seo] = await Promise.all([
    getProductsByCategorySlug(slug, 1, sort).catch(() => null),
    parentSlug ? getCategory(parentSlug).catch(() => null) : Promise.resolve(null),
    resolveSiteSeo(),
  ]);

  const products = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;

  const siblings = parentCategory ? (parentCategory.children ?? []) : (category.children ?? []);
  const parentCategorySlug = category.parent?.slug ?? slug;
  const parentCategoryName = category.parent?.name ?? category.name;

  const url = absoluteUrl(`/collections/${slug}`);
  const intro = category.meta?.description?.trim() || "";

  const crumbs = [
    { name: "Home", url: absoluteUrl("/") },
    ...(category.parent
      ? [
          {
            name: category.parent.name,
            url: absoluteUrl(`/collections/${category.parent.slug}`),
          },
        ]
      : []),
    { name: category.name, url },
  ];

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          name: category.name,
          description: intro || undefined,
          url,
          total,
          brandName: seo.name,
          products: products.map((product) => ({
            slug: product.slug,
            title: product.title,
            description: product.description,
            status: product.status,
            images: product.images,
            variants: product.variants,
            categoryName: category.name,
            ratingSummary: product.ratingSummary,
          })),
        })}
      />
      <BreadcrumbJsonLd items={crumbs} />

      <nav
        className="container-page flex flex-wrap items-center gap-1 py-3 text-xs text-muted sm:py-4 sm:text-sm"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        {category.parent && (
          <>
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <Link
              href={`/collections/${category.parent.slug}`}
              className="hover:text-foreground"
            >
              {category.parent.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      {category.imageUrl ? (
        <section className="relative border-b border-border bg-[#1c1816] h-[180px] sm:h-[240px] lg:h-[300px] w-full overflow-hidden">
          <Image
            src={category.imageUrl}
            alt={`${category.name} collection banner`}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 lg:p-8">
            <div className="container-page w-full min-w-0">
              <h1 className="font-display text-2xl font-bold text-white drop-shadow-md sm:text-4xl lg:text-5xl">
                {category.name}
              </h1>
              {intro && (
                <p className="mt-1.5 max-w-xl text-xs text-white/80 line-clamp-1 sm:line-clamp-2 sm:text-sm drop-shadow">
                  {intro}
                </p>
              )}
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gold drop-shadow">
                {total} product{total !== 1 ? "s" : ""}
                {siblings.length > 0 ? " across all sub-categories" : " in this category"}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <div className="container-page pt-6 sm:pt-8">
          <h1 className="font-display text-2xl font-semibold sm:text-4xl lg:text-5xl">
            {category.name}
          </h1>
          {intro ? (
            <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">{intro}</p>
          ) : null}
        </div>
      )}

      <div className="container-page py-6 sm:py-10">
        {siblings.length > 0 && (
          <div className="mb-5 flex gap-1.5 overflow-x-auto pb-2 scrollbar-none sm:mb-8 sm:gap-2 sm:overflow-x-visible sm:pb-0 sm:flex-wrap">
            <Link
              href={`/collections/${parentCategorySlug}`}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm",
                slug === parentCategorySlug
                  ? "border-primary bg-primary text-surface"
                  : "border-border bg-surface text-muted hover:border-secondary hover:text-foreground",
              )}
            >
              All {parentCategoryName}
            </Link>
            {siblings.map((child) => (
              <Link
                key={child._id}
                href={`/collections/${child.slug}`}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm",
                  slug === child.slug
                    ? "border-primary bg-primary text-surface"
                    : "border-border bg-surface text-muted hover:border-secondary hover:text-foreground",
                )}
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}

        <Suspense
          fallback={<div className="mb-4 h-10 animate-pulse rounded-lg bg-border sm:mb-6 sm:h-12" />}
        >
          <CategoryToolbar />
        </Suspense>

        <InfiniteProductGrid
          key={`${slug}-${sort}`}
          initialProducts={products}
          totalPages={totalPages}
          source={{ type: "category", slug, sort }}
          emptyMessage="No products in this category yet."
        />

        {/* On-Page SEO Internal Link Cluster Widget */}
        <section className="mt-12 rounded-2xl border border-border/80 bg-surface/80 p-6 sm:p-8 shadow-warm">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b8863a]">Explore Bamboo Home Decor</span>
          <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground mt-1">Discover Other Handcrafted Bamboo Categories</h3>
          <p className="mt-1.5 text-xs sm:text-sm text-muted">Hand-woven by Tripura artisans using 100% sustainable golden bamboo.</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link href="/collections/lamp-lights" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-[#b8863a] hover:text-white hover:border-[#b8863a]">
              Bamboo Lamp & Lights →
            </Link>
            <Link href="/collections/utility-basket" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-[#b8863a] hover:text-white hover:border-[#b8863a]">
              Utility Storage Baskets →
            </Link>
            <Link href="/collections/decorative-furnishing" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-[#b8863a] hover:text-white hover:border-[#b8863a]">
              Decorative Furnishings →
            </Link>
            <Link href="/collections/bags-accessories" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-[#b8863a] hover:text-white hover:border-[#b8863a]">
              Bags & Accessories →
            </Link>
            <Link href="/artisan-stories" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-[#b8863a] hover:text-white hover:border-[#b8863a]">
              🌿 Agartala Artisan Lineage →
            </Link>
            <Link href="/guides" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-[#b8863a] hover:text-white hover:border-[#b8863a]">
              📖 Care & Maintenance Guides →
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
