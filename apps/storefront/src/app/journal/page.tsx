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
    <div className="container-page py-5 sm:py-14">
      <h1 className="font-display text-2xl text-primary sm:text-4xl">Journal</h1>
      <p className="mt-1 text-sm text-muted sm:mt-2">Stories, guides, and sustainable living ideas</p>
      <JournalGrid posts={posts} />
    </div>
  );
}
