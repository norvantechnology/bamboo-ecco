import type { Metadata } from "next";
import { getJournalPosts } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";
import { JournalGrid } from "@/components/journal/journal-grid";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Journal",
    description: "Stories, inspiration, and ideas for mindful living with natural home decor.",
    path: "/journal",
  });
}

export default async function JournalPage() {
  const posts = await getJournalPosts("blog").catch(() => []);

  return (
    <div className="container-page py-6 sm:py-14">
      <div className="max-w-2xl">
        <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#b8863a] bg-[#b8863a]/10 px-3.5 py-1 rounded-full border border-[#b8863a]/25 mb-3">
          🌿 Stories & Inspiration
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
