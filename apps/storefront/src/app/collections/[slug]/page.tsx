import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { CategoryToolbar } from "@/components/category/category-toolbar";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import { getCategory, getProductsByCategorySlug } from "@/lib/api";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
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
  const page = Math.max(1, Number(sp.page ?? "1"));
  const sortParam = sp.sort ?? "newest";
  const sort = VALID_SORTS.includes(sortParam as (typeof VALID_SORTS)[number])
    ? (sortParam as (typeof VALID_SORTS)[number])
    : "newest";

  const [category, result] = await Promise.all([
    getCategory(slug).catch(() => null),
    getProductsByCategorySlug(slug, page, sort).catch(() => null),
  ]);

  if (!category) notFound();

  const products = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;
  const children = category.children ?? [];
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
        <section className="border-y border-border bg-[#2a2622]">
          <div className="relative mx-auto h-[200px] w-full sm:h-[280px] lg:h-[340px]">
            <Image
              src={category.imageUrl}
              alt={category.name}
              fill
              priority
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </section>
      ) : null}

      <div className="container-page py-6 sm:py-10">
        <div className="mb-5 sm:mb-8">
          <p className="text-xs font-medium uppercase tracking-widest text-gold">Category</p>
          <h1 className="mt-2 font-display text-2xl font-semibold sm:text-4xl lg:text-5xl">
            {category.name}
          </h1>
          {intro ? (
            <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">{intro}</p>
          ) : null}
          <p className="mt-2 text-xs text-muted sm:text-sm">
            {total} product{total !== 1 ? "s" : ""}
            {children.length > 0 ? " across all sub-categories" : " in this category"}
          </p>
        </div>

        {children.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-1.5 sm:mb-8 sm:gap-2">
            <Link
              href={`/collections/${slug}`}
              className="rounded-full border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-surface sm:px-4 sm:py-2 sm:text-sm"
            >
              All {category.name}
            </Link>
            {children.map((child) => (
              <Link
                key={child._id}
                href={`/collections/${child.slug}`}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-secondary hover:text-foreground sm:px-4 sm:py-2 sm:text-sm"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}

        <Suspense
          fallback={<div className="mb-4 h-10 animate-pulse rounded-lg bg-border sm:mb-6 sm:h-12" />}
        >
          <CategoryToolbar totalPages={totalPages} />
        </Suspense>

        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {products.length === 0 && (
          <p className="py-10 text-center text-sm text-muted sm:py-16">
            No products in this category yet.
          </p>
        )}
      </div>
    </>
  );
}
