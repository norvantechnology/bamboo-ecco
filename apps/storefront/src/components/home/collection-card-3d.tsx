"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card3D } from "@/components/animation/card-3d";
import type { Category } from "@/lib/api";

interface CollectionCard3DProps {
  category: Category;
  index?: number;
}

export function CollectionCard3D({ category, index = 0 }: CollectionCard3DProps) {
  return (
    <div data-collection-card data-index={index} className="h-full">
      <Card3D className="h-full" intensity={10}>
        <Link
          href={`/collections/${category.slug}`}
          className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-[#e8e2d8] shadow-warm transition-shadow duration-500 hover:shadow-warm-lg"
        >
          <div className="absolute inset-0">
            {category.imageUrl ? (
              <Image
                src={category.imageUrl}
                alt={category.name}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#d4c9b8] to-[#b8a88e]" />
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/80 via-[#1a1410]/20 to-transparent" />
          <div className="absolute inset-0 bg-[#1a1410]/0 transition-colors duration-500 group-hover:bg-[#1a1410]/10" />

          <div className="absolute inset-x-0 bottom-0 z-[2] p-2.5 sm:p-5">
            <span className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-gold sm:mb-1.5 sm:text-xs">
              Collection
            </span>
            <span className="flex items-end justify-between gap-2 font-display text-base font-semibold leading-tight text-white sm:gap-3 sm:text-2xl">
              <span className="min-w-0 flex-1 line-clamp-2">{category.name}</span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm transition-all duration-300 ease-out group-hover:border-white/50 group-hover:bg-white/20 sm:h-8 sm:w-8">
                <ArrowUpRight className="collection-arrow h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
            </span>
          </div>
        </Link>
      </Card3D>
    </div>
  );
}
