"use client";

import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/lib/api";
import { MotionStaggerContainer, MotionStaggerChild, childFadeUpVariants } from "@/components/ui/motion-reveal";

export function GuidesGrid({ posts }: { posts: BlogPost[] }) {
  return (
    <MotionStaggerContainer
      staggerDelay={0.08}
      className="mt-6 grid gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
    >
      {posts.map((post) => (
        <MotionStaggerChild key={post._id} variants={childFadeUpVariants}>
          <Link
            href={`/guides/${post.slug}`}
            className="group flex flex-col h-full overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:shadow-lg sm:flex-row"
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
        </MotionStaggerChild>
      ))}
    </MotionStaggerContainer>
  );
}
