"use client";

import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/lib/api";
import { MotionStaggerContainer, MotionStaggerChild, childFadeUpVariants } from "@/components/ui/motion-reveal";

export function GuidesGrid({ posts }: { posts: BlogPost[] }) {
  return (
    <MotionStaggerContainer
      staggerDelay={0.08}
      className="mt-6 grid gap-4 sm:mt-10 sm:gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
    >
      {posts.map((post) => (
        <MotionStaggerChild key={post._id} variants={childFadeUpVariants}>
          <Link
            href={`/guides/${post.slug}`}
            className="group flex flex-col justify-between h-full overflow-hidden rounded-2xl border border-border/80 bg-surface p-5 shadow-warm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#C9A24B]/40 hover:shadow-warm-lg"
          >
            <div>
              {post.heroImage ? (
                <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl bg-muted/20 mb-4">
                  <Image
                    src={post.heroImage}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 40vw"
                  />
                </div>
              ) : null}
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#b8863a] bg-[#b8863a]/10 px-2.5 py-1 rounded-full mb-2.5">
                💡 Buying & Care Guide
              </span>
              <h2 className="font-sans font-bold text-base sm:text-lg text-foreground group-hover:text-[#b8863a] transition-colors leading-snug">
                {post.title}
              </h2>
              {post.meta?.description && (
                <p className="mt-2 text-xs sm:text-sm text-muted line-clamp-3 leading-relaxed font-sans">
                  {post.meta.description}
                </p>
              )}
            </div>
            <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#b8863a] group-hover:underline">
                Read guide
              </span>
              <span className="text-sm font-semibold text-[#b8863a] transition-transform duration-300 group-hover:translate-x-1 font-sans">
                →
              </span>
            </div>
          </Link>
        </MotionStaggerChild>
      ))}
    </MotionStaggerContainer>
  );
}
