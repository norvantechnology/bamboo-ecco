import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJournalPost } from "@/lib/api";
import { articleJsonLd, buildPageMetadata } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getJournalPost(slug).catch(() => null);
  return buildPageMetadata({
    title: post?.meta?.title ?? post?.title ?? "Journal",
    description: post?.meta?.description,
    path: `/journal/${slug}`,
  });
}

export default async function JournalArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getJournalPost(slug).catch(() => null);
  if (!post) notFound();

  const jsonLd = articleJsonLd({
    title: post.title,
    slug,
    description: post.meta?.description,
    publishedAt: post.publishedAt,
    pathPrefix: "journal",
  });

  return (
    <article className="container-page max-w-3xl py-10 sm:py-14">
      <Link href="/journal" className="text-sm text-secondary hover:underline">← Journal</Link>
      <h1 className="mt-6 font-display text-3xl text-primary sm:text-4xl">{post.title}</h1>
      <div className="prose prose-neutral mt-8 max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: post.body }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  );
}
