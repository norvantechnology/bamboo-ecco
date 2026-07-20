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
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

const VALID_SORTS = ["newest", "price-asc", "price-desc", "rating"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug).catch(() => null);
  if (!category) return { title: "Category" };
  return buildPageMetadata({
    title: category.meta?.title || category.name,
    description:
      category.meta?.description ||
      `Shop ${category.name} — handcrafted bamboo lamps, lights & home decor online in India`,
    path: `/collections/${slug}`,
    image: category.imageUrl,
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

  const [result, parentCategory] = await Promise.all([
    getProductsByCategorySlug(slug, 1, sort).catch(() => null),
    parentSlug ? getCategory(parentSlug).catch(() => null) : Promise.resolve(null),
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
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: category.name,
          description: intro || undefined,
          url,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: products.length,
            itemListElement: products.map((product, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(`/product/${product.slug}`),
              name: product.title,
            })),
          },
        }}
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
            alt=""
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
      </div>
    </>
  );
}
