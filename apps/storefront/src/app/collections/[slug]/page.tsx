import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getCollection } from "@/lib/api";
import { CollectionStoryLoader } from "@/components/collection/collection-story-loader";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCollection(slug).catch(() => null);
  if (!data) return { title: "Collection" };
  return buildPageMetadata({
    title: data.category.story?.headline || data.category.name,
    description:
      data.category.story?.subheading ||
      `Explore the ${data.category.name} collection — handcrafted bamboo for modern living.`,
    path: `/collections/${slug}`,
  });
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCollection(slug).catch(() => null);
  if (!data) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: data.category.story?.headline || data.category.name,
    description: data.category.story?.subheading,
    url: absoluteUrl(`/collections/${slug}`),
  };

  return (
    <>
      <nav className="container-page flex items-center gap-1 py-4 text-sm text-muted">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{data.category.name}</span>
      </nav>
      <CollectionStoryLoader data={data} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
