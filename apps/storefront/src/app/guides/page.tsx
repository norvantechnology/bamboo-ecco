import type { Metadata } from "next";
import { getJournalPosts } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";
import { GuidesGrid } from "@/components/journal/guides-grid";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "Buying Guides",
    description: "Expert buying guides for bamboo furniture and sustainable home decor.",
    path: "/guides",
  });
}

export default async function GuidesPage() {
  const posts = await getJournalPosts("guide").catch(() => []);

  return (
    <div className="container-page py-5 sm:py-14">
      <h1 className="font-display text-2xl text-primary sm:text-4xl">Buying Guides</h1>
      <p className="mt-1 text-sm text-muted sm:mt-2">Expert advice, size guides, and eco-friendly shopping tips</p>
      <GuidesGrid posts={posts} />
    </div>
  );
}
