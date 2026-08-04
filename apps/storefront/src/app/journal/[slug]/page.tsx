import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getJournalPost, getProductsByCategorySlug, type Product } from "@/lib/api";
import { ProductCard } from "@/components/product/product-card";
import { ArticleJsonLd } from "@/components/seo/article-json-ld";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { resolveSiteSeo } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getJournalPost(slug).catch(() => null);
  return buildPageMetadata({
    title: post?.meta?.title ?? post?.title ?? "Journal",
    description: post?.meta?.description,
    image: post?.heroImage || undefined,
    path: `/journal/${slug}`,
  });
}

export default async function JournalArticlePage({ params }: Props) {
  const { slug } = await params;
  const [post, seo, productsResult] = await Promise.all([
    getJournalPost(slug).catch(() => null),
    resolveSiteSeo(),
    getProductsByCategorySlug("lamp-lights", 1, "newest").catch(() => null),
  ]);
  if (!post) notFound();

  const featuredProducts: Product[] = productsResult?.data ?? [];

  return (
    <article className="container-page max-w-4xl lg:max-w-5xl py-10 sm:py-14">
      <ArticleJsonLd
        title={post.title}
        slug={slug}
        description={post.meta?.description}
        heroImage={post.heroImage}
        publishedAt={post.publishedAt}
        pathPrefix="journal"
        publisherName={seo.name || undefined}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: absoluteUrl("/") },
          { name: "Journal", url: absoluteUrl("/journal") },
          { name: post.title, url: absoluteUrl(`/journal/${slug}`) },
        ]}
      />
      <Link href="/journal" className="text-xs font-bold uppercase tracking-wider text-[#b8863a] hover:underline">← Back to Journal</Link>
      <h1 className="mt-3 font-display text-3xl text-foreground sm:text-4xl leading-tight font-semibold">{post.title}</h1>

      {post.heroImage ? (
        <div className="mt-6 overflow-hidden rounded-2xl bg-muted/20 shadow-warm">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={post.heroImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
          {post.imageCredit ? (
            <p className="px-4 py-2 text-right text-xs italic text-muted opacity-75">{post.imageCredit}</p>
          ) : null}
        </div>
      ) : null}

      <div className="cms-content mt-8 prose prose-stone dark:prose-invert max-w-none text-foreground leading-relaxed sm:text-lg" dangerouslySetInnerHTML={{ __html: post.body }} />

      {/* Dynamic Products Interlink Section */}
      {featuredProducts.length > 0 && (
        <div className="mt-12 pt-8 border-t border-border/80">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b8863a]">Crafted With Care</span>
              <h3 className="font-display text-xl sm:text-2xl font-semibold text-foreground mt-1">Featured Handcrafted Products</h3>
            </div>
            <Link href="/shop" className="text-xs font-semibold text-[#b8863a] hover:underline hidden sm:block">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* On-Page SEO Internal Link Cluster Widget */}
      <div className="mt-10 rounded-2xl border border-border/80 bg-surface/80 p-6 sm:p-8 shadow-warm">
        <h3 className="font-display text-xl font-semibold text-foreground">Explore Handcrafted Collections</h3>
        <p className="mt-1.5 text-xs sm:text-sm text-muted">Discover sustainably sourced, Indian artisan bamboo decor designed to bring warm natural texture into your living spaces.</p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link href="/collections/lamp-lights" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-[#b8863a] hover:text-white hover:border-[#b8863a]">
            Bamboo Lamp & Lights →
          </Link>
          <Link href="/collections/utility-basket" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-[#b8863a] hover:text-white hover:border-[#b8863a]">
            Utility Baskets →
          </Link>
          <Link href="/collections/decorative-furnishing" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-[#b8863a] hover:text-white hover:border-[#b8863a]">
            Decorative Furnishings →
          </Link>
          <Link href="/collections/bags-accessories" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-[#b8863a] hover:text-white hover:border-[#b8863a]">
            Bags & Accessories →
          </Link>
          <Link href="/artisan-stories" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-[#b8863a] hover:text-white hover:border-[#b8863a]">
            Agartala Artisan Lineage →
          </Link>
          <Link href="/shop" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-[#b8863a] hover:text-white hover:border-[#b8863a]">
            Shop All Bamboo Decor →
          </Link>
        </div>
      </div>
    </article>
  );
}
