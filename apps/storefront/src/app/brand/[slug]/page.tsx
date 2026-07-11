import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, getProductsByCategorySlug } from "@/lib/api";
import { ProductCard } from "@/components/product/product-card";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { getSiteName } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug).catch(() => null);
  if (!category) return { title: "Brand" };
  const siteName = getSiteName();
  return buildPageMetadata({
    title: `${category.name} — ${siteName}`,
    description: `Shop handcrafted ${category.name.toLowerCase()} made from sustainable bamboo. Premium quality, eco-friendly home decor.`,
    path: `/brand/${slug}`,
  });
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  const [category, products] = await Promise.all([
    getCategory(slug).catch(() => null),
    getProductsByCategorySlug(slug, 1, "rating").catch(() => ({ data: [], total: 0, page: 1, totalPages: 0 })),
  ]);

  if (!category) notFound();

  const pageUrl = absoluteUrl(`/brand/${slug}`);
  const siteName = getSiteName();

  return (
    <div className="container-page py-10 sm:py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Brand",
          name: `${siteName} ${category.name}`,
          description: `Sustainable bamboo ${category.name.toLowerCase()} for modern homes`,
          url: pageUrl,
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: absoluteUrl("/") },
          { name: "Shop", url: absoluteUrl("/shop") },
          { name: category.name, url: pageUrl },
        ]}
      />
      <nav className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-primary">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-secondary">{siteName} Brand</p>
          <h1 className="mt-2 font-display text-4xl text-primary sm:text-5xl">{category.name}</h1>
          <p className="mt-4 text-muted leading-relaxed">
            Discover our curated {category.name.toLowerCase()} collection — handcrafted from sustainably sourced bamboo,
            designed for calm, modern living spaces across India.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/category/${slug}`} className="inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-surface">
              Shop {category.name}
            </Link>
            <Link href={`/collections/${slug}`} className="inline-flex h-11 items-center rounded-sm border border-border px-6 text-sm font-medium hover:bg-surface">
              View collection story
            </Link>
          </div>
        </div>
        {category.imageUrl && (
          <div className="image-frame relative aspect-[4/3] overflow-hidden rounded-lg">
            <Image src={category.imageUrl} alt={category.name} fill sizes="50vw" className="image-fit-contain p-2 sm:p-3" priority />
          </div>
        )}
      </div>

      <section className="mt-16">
        <h2 className="font-display text-2xl">Top {category.name}</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.data.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
        {products.totalPages > 1 && (
          <div className="mt-8 text-center">
            <Link href={`/category/${slug}`} className="text-sm font-medium text-secondary hover:underline">
              View all {products.total} products →
            </Link>
          </div>
        )}
      </section>

    </div>
  );
}
