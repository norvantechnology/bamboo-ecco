import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getJournalPost } from "@/lib/api";
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
    title: post?.meta?.title ?? post?.title ?? "Guide",
    description: post?.meta?.description,
    image: post?.heroImage || undefined,
    path: `/guides/${slug}`,
  });
}

export default async function GuideArticlePage({ params }: Props) {
  const { slug } = await params;
  const [post, seo] = await Promise.all([
    getJournalPost(slug).catch(() => null),
    resolveSiteSeo(),
  ]);
  if (!post) notFound();

  return (
    <article className="container-page max-w-4xl lg:max-w-5xl py-10 sm:py-14">
      <ArticleJsonLd
        title={post.title}
        slug={slug}
        description={post.meta?.description}
        publishedAt={post.publishedAt}
        pathPrefix="guides"
        publisherName={seo.name || undefined}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: absoluteUrl("/") },
          { name: "Guides", url: absoluteUrl("/guides") },
          { name: post.title, url: absoluteUrl(`/guides/${slug}`) },
        ]}
      />
      <Link href="/guides" className="text-sm font-medium text-accent hover:underline">
        ← Back to Guides
      </Link>
      <h1 className="mt-4 font-display text-3xl text-primary sm:text-4xl leading-tight">{post.title}</h1>

      {post.heroImage ? (
        <div className="mt-6 overflow-hidden rounded-xl bg-muted/20">
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

      <div className="cms-content mt-8" dangerouslySetInnerHTML={{ __html: post.body }} />

      {/* On-Page SEO Internal Link Cluster Widget */}
      <div className="mt-12 rounded-2xl border border-border bg-surface/80 p-6 sm:p-8 shadow-warm">
        <h3 className="font-display text-xl font-semibold text-foreground">Shop Featured Bamboo Collections</h3>
        <p className="mt-1.5 text-sm text-muted">Explore handcrafted bamboo home products curated by artisans across Northeast India.</p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link href="/collections/pendant-light" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-gold hover:text-white hover:border-gold">
            Bamboo Pendant Lights →
          </Link>
          <Link href="/collections/table-lamp" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-gold hover:text-white hover:border-gold">
            Bamboo Table Lamps →
          </Link>
          <Link href="/collections/utility-basket" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-gold hover:text-white hover:border-gold">
            Utility Storage Baskets →
          </Link>
          <Link href="/collections/decorative-furnishing" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-gold hover:text-white hover:border-gold">
            Decorative Furnishings →
          </Link>
          <Link href="/shop" className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-gold hover:text-white hover:border-gold">
            Shop All Bamboo Decor →
          </Link>
        </div>
      </div>
    </article>
  );
}
