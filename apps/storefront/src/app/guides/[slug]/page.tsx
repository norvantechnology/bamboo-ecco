import type { Metadata } from "next";
import Link from "next/link";
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
    <article className="container-page max-w-3xl py-10 sm:py-14">
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
      <Link href="/guides" className="text-sm text-secondary hover:underline">
        ← Guides
      </Link>
      <h1 className="mt-6 font-display text-3xl text-primary sm:text-4xl">{post.title}</h1>
      <div
        className="prose prose-neutral mt-8 max-w-none text-foreground"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />
    </article>
  );
}
