import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { CategoryToolbar } from "@/components/category/category-toolbar";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
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
      category.meta?.description || `Shop ${category.name} — handcrafted bamboo home decor`,
    path: `/category/${slug}`,
    image: category.imageUrl,
    imageAlt: category.name,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
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

  const crumbs = [
    { name: "Home", url: absoluteUrl("/") },
    ...(category.parent
      ? [{ name: category.parent.name, url: absoluteUrl(`/category/${category.parent.slug}`) }]
      : []),
    { name: category.name, url: absoluteUrl(`/category/${slug}`) },
  ];

  return (
    <div className="container-page py-4 sm:py-10">
      <BreadcrumbJsonLd items={crumbs} />
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted sm:mb-6 sm:text-sm" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        {category.parent && (
          <>
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <Link href={`/category/${category.parent.slug}`} className="hover:text-foreground">
              {category.parent.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      <div className="mb-4 sm:mb-8">
        <h1 className="font-display text-xl font-semibold sm:text-3xl lg:text-4xl">
          {category.name}
        </h1>
        <p className="mt-1 text-xs text-muted sm:mt-2 sm:text-base">
          {total} product{total !== 1 ? "s" : ""}
          {children.length > 0 ? " across all sub-categories" : " in this category"}
        </p>
      </div>

      {children.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5 sm:mb-8 sm:gap-2">
          <Link
            href={`/category/${slug}`}
            className="rounded-full border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-surface sm:px-4 sm:py-2 sm:text-sm"
          >
            All {category.name}
          </Link>
          {children.map((child) => (
            <Link
              key={child._id}
              href={`/category/${child.slug}`}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-secondary hover:text-foreground sm:px-4 sm:py-2 sm:text-sm"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      <Suspense fallback={<div className="mb-4 h-10 animate-pulse rounded-lg bg-border sm:mb-6 sm:h-12" />}>
        <CategoryToolbar totalPages={totalPages} />
      </Suspense>

      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <p className="py-10 text-center text-sm text-muted sm:py-16">No products in this category yet.</p>
      )}
    </div>
  );
}
