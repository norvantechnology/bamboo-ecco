"use client";

import Image from "next/image";
import Link from "next/link";
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
          aria-label={category.name}
          className="group flex h-full flex-col overflow-hidden rounded-xl bg-surface shadow-warm transition-shadow duration-500 hover:shadow-warm-lg sm:rounded-2xl"
        >
          <div className="relative aspect-[3/4] overflow-hidden bg-[#e8e2d8] dark:bg-[#22201d]">
            {category.imageUrl ? (
              <Image
                src={category.imageUrl}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                quality={75}
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#d4c9b8] to-[#b8a88e]" />
            )}
          </div>
          <span className="block p-2.5 font-display text-sm font-semibold leading-tight text-foreground sm:p-3 sm:text-base">
            {category.name}
          </span>
        </Link>
      </Card3D>
    </div>
  );
}
