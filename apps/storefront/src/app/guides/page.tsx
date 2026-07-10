import type { Metadata } from "next";
import Link from "next/link";
import { getJournalPosts } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Buying Guides",
  description: "Expert buying guides for bamboo furniture and sustainable home decor.",
  path: "/guides",
});

export default async function GuidesPage() {
  const posts = await getJournalPosts("guide").catch(() => []);

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="font-display text-3xl text-primary sm:text-4xl">Guides</h1>
      <p className="mt-2 text-muted">Buying guides and sustainable living ideas</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post._id}
            href={`/guides/${post.slug}`}
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
