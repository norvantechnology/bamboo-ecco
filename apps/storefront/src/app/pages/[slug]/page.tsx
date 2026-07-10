import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticPage } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getStaticPage(slug).catch(() => null);
  return buildPageMetadata({
    title: page?.meta?.title ?? page?.title ?? slug,
    description: page?.meta?.description,
    path: `/pages/${slug}`,
  });
}

export default async function StaticContentPage({ params }: Props) {
  const { slug } = await params;
  const page = await getStaticPage(slug).catch(() => null);
  if (!page) notFound();

  return (
    <div className="container-page max-w-3xl py-8 sm:py-14">
      <h1 className="font-display text-2xl sm:text-4xl">{page.title}</h1>
      <div className="cms-content mt-6 sm:mt-8" dangerouslySetInnerHTML={{ __html: page.body }} />
    </div>
  );
}
