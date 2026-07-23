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
    title: post?.meta?.title ?? post?.title ?? "Journal",
    description: post?.meta?.description,
    image: post?.heroImage || undefined,
    path: `/journal/${slug}`,
  });
}

export default async function JournalArticlePage({ params }: Props) {
  const { slug } = await params;
  const [post, seo] = await Promise.all([
    getJournalPost(slug).catch(() => null),
    resolveSiteSeo(),
  ]);
  if (!post) notFound();

  return (
    <article className="container-page max-w-3xl py-10 sm:py-14">
      <ArticleJsonLd
        title={post.title}
        slug={slug}
        description={post.meta?.description}
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
      <Link href="/journal" className="text-sm font-medium text-accent hover:underline">← Back to Journal</Link>
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
    </article>
  );
}
