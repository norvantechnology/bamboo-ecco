import type { Metadata } from "next";
import Link from "next/link";
import { getJournalPosts } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Journal",
  description: "Stories, inspiration, and ideas for mindful living with natural home decor.",
  path: "/journal",
});

export default async function JournalPage() {
  const posts = await getJournalPosts("blog").catch(() => []);

  return (
    <div className="container-page py-5 sm:py-14">
      <h1 className="font-display text-2xl text-primary sm:text-4xl">Journal</h1>
      <p className="mt-1 text-sm text-muted sm:mt-2">Stories, guides, and sustainable living ideas</p>
      <div className="mt-5 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6">
        {posts.map((post) => (
          <Link
            key={post._id}
            href={`/journal/${post.slug}`}
            className="rounded-lg border border-border bg-surface p-8 transition-shadow hover:shadow-md"
          >
            <h2 className="font-display text-xl text-primary">{post.title}</h2>
            {post.meta?.description && <p className="mt-2 text-sm text-muted line-clamp-2">{post.meta.description}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
