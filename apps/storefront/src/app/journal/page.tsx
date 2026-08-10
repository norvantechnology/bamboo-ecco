import type { Metadata } from "next";
import { getJournalPosts } from "@/lib/api";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { JournalGrid } from "@/components/journal/journal-grid";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Bamboo Journal — Sustainable Living & Home Decor Ideas",
    description:
      "Read bamboo furniture tips, sustainable living ideas, and handcrafted décor inspiration for modern Indian homes.",
    path: "/journal",
    keywords: "bamboo journal, bamboo decor ideas, sustainable living India, bamboo furniture tips",
  });
}

export default async function JournalPage() {
  const posts = await getJournalPosts("blog").catch(() => []);

  return (
    <div className="container-page py-6 sm:py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Bamboo Eco-Hub Journal",
          description: "Stories and ideas for mindful living with natural bamboo home decor.",
          url: absoluteUrl("/journal"),
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: posts.length,
            itemListElement: posts.slice(0, 20).map((post, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(`/journal/${post.slug}`),
              name: post.title,
            })),
          },
        }}
      />
      <div className="max-w-2xl">
        <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#b8863a] bg-[#b8863a]/10 px-3.5 py-1 rounded-full border border-[#b8863a]/25 mb-3">
          Stories & Inspiration
        </span>
        <h1 className="font-display text-3xl text-foreground sm:text-5xl font-semibold tracking-tight">Journal</h1>
        <p className="mt-2 text-xs sm:text-base text-muted font-sans leading-relaxed">
          Stories of master craftsmanship, sustainable home styling tips, and Tripura heritage.
        </p>
      </div>
      <JournalGrid posts={posts} />
    </div>
  );
}
