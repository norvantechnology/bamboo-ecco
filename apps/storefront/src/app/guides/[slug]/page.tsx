import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getJournalPost } from "@/lib/api";
import { articleJsonLd, breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

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
  const post = await getJournalPost(slug).catch(() => null);
  if (!post) notFound();

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const jsonLd = [
    articleJsonLd({
      title: post.title,
      slug,
      description: post.meta?.description,
      publishedAt: post.publishedAt,
      pathPrefix: "guides",
    }),
    breadcrumbJsonLd([
      { name: "Home", url: base },
      { name: "Guides", url: `${base}/guides` },
      { name: post.title, url: `${base}/guides/${slug}` },
    ]),
  ];

  return (
    <article className="container-page max-w-3xl py-10 sm:py-14">
      <Link href="/guides" className="text-sm text-secondary hover:underline">
        ← Guides
      </Link>
      <h1 className="mt-6 font-display text-3xl text-primary sm:text-4xl">{post.title}</h1>
      <div
        className="prose prose-neutral mt-8 max-w-none text-foreground"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </article>
  );
}
