import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getCollection } from "@/lib/api";
import { CollectionStoryLoader } from "@/components/collection/collection-story-loader";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCollection(slug).catch(() => null);
  if (!data) return { title: "Collection" };
  return buildPageMetadata({
    title: data.category.meta?.title || data.category.story?.headline || data.category.name,
    description:
      data.category.meta?.description ||
      data.category.story?.subheading ||
      `Explore the ${data.category.name} collection — handcrafted bamboo for modern living.`,
    path: `/collections/${slug}`,
    image: data.category.imageUrl,
    imageAlt: data.category.name,
  });
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCollection(slug).catch(() => null);
  if (!data) notFound();

  const url = absoluteUrl(`/collections/${slug}`);
  const name = data.category.story?.headline || data.category.name;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name,
          description: data.category.story?.subheading,
          url,
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: absoluteUrl("/") },
          { name: "Shop", url: absoluteUrl("/shop") },
          { name: data.category.name, url },
        ]}
      />
      <nav className="container-page flex items-center gap-1 py-4 text-sm text-muted">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{data.category.name}</span>
      </nav>
      <CollectionStoryLoader data={data} />
    </>
  );
}
