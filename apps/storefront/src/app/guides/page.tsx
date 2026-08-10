import type { Metadata } from "next";
import { getJournalPosts } from "@/lib/api";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { GuidesGrid } from "@/components/journal/guides-grid";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Bamboo Buying Guides — Lamps, Baskets & Home Decor",
    description:
      "Expert bamboo buying guides for pendant lights, floor lamps, string lights, baskets, and sustainable home décor in India.",
    path: "/guides",
    keywords: "bamboo buying guide, bamboo lamp guide, bamboo basket guide, sustainable decor India",
  });
}

export default async function GuidesPage() {
  const posts = await getJournalPosts("guide").catch(() => []);

  return (
    <div className="container-page py-6 sm:py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Bamboo Eco-Hub Buying Guides",
          description: "Expert buying and care guides for bamboo furniture and sustainable home decor.",
          url: absoluteUrl("/guides"),
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: posts.length,
            itemListElement: posts.slice(0, 20).map((post, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(`/guides/${post.slug}`),
              name: post.title,
            })),
          },
        }}
      />
      <div className="max-w-2xl">
        <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#b8863a] bg-[#b8863a]/10 px-3.5 py-1 rounded-full border border-[#b8863a]/25 mb-3">
          Expert Knowledge
        </span>
        <h1 className="font-display text-3xl text-foreground sm:text-5xl font-semibold tracking-tight">Buying & Care Guides</h1>
        <p className="mt-2 text-xs sm:text-base text-muted font-sans leading-relaxed">
          Expert advice, dimension guides, humidity care, and eco-friendly home decor styling.
        </p>
      </div>
      <GuidesGrid posts={posts} />
    </div>
  );
}
