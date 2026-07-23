import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getJournalPosts } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";

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
      <div className="mt-6 grid gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post._id}
            href={`/guides/${post.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:flex-row"
          >
            {post.heroImage ? (
              <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-muted/20 sm:w-2/5">
                <Image
                  src={post.heroImage}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 40vw"
                />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col p-6">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Guide</span>
              <h2 className="mt-1 font-display text-xl text-primary group-hover:text-primary-dark transition-colors">
                {post.title}
              </h2>
              {post.meta?.description && (
                <p className="mt-2 text-sm text-muted line-clamp-3 leading-relaxed">
                  {post.meta.description}
                </p>
              )}
              <div className="mt-auto pt-4 text-xs font-semibold text-accent flex items-center gap-1 group-hover:underline">
                Read guide &rarr;
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
