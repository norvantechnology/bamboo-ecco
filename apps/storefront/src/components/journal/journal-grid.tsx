"use client";

import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/lib/api";
import { MotionStaggerContainer, MotionStaggerChild, childFadeUpVariants } from "@/components/ui/motion-reveal";

export function JournalGrid({ posts }: { posts: BlogPost[] }) {
  return (
    <MotionStaggerContainer
      staggerDelay={0.08}
      className="mt-6 grid gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
    >
      {posts.map((post) => (
        <MotionStaggerChild key={post._id} variants={childFadeUpVariants}>
          <Link
            href={`/journal/${post.slug}`}
            className="group flex flex-col h-full overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            {post.heroImage ? (
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/20">
                <Image
                  src={post.heroImage}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col p-6">
              <h2 className="font-display text-xl text-primary group-hover:text-primary-dark transition-colors">
                {post.title}
              </h2>
              {post.meta?.description && (
                <p className="mt-3 text-sm text-muted line-clamp-3 leading-relaxed">
                  {post.meta.description}
                </p>
              )}
              <div className="mt-auto pt-4 text-xs font-semibold text-accent flex items-center gap-1 group-hover:underline">
                Read story &rarr;
              </div>
            </div>
          </Link>
        </MotionStaggerChild>
      ))}
    </MotionStaggerContainer>
  );
}
