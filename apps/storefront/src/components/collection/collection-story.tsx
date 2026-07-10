"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type { CollectionData } from "@/lib/api";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";

interface Props {
  data: CollectionData;
}

export function CollectionStory({ data }: Props) {
  const { category, products } = data;
  const story = category.story;
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!story?.sections?.length) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);
    const ticker = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      gsap.from("[data-hero-content]", {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: "power3.out",
      });

      gsap.utils.toArray<HTMLElement>("[data-story-section]").forEach((section) => {
        const image = section.querySelector("[data-story-image]");
        const text = section.querySelector("[data-story-text]");

        gsap.from(text, {
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
          y: 40,
          opacity: 0,
          duration: 0.9,
          ease: "power2.out",
        });

        gsap.from(image, {
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
          scale: 1.05,
          opacity: 0,
          duration: 1,
          ease: "power2.out",
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-pin-section]").forEach((section) => {
        const inner = section.querySelector("[data-pin-inner]");
        if (!inner) return;

        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: "+=80%",
          pin: inner,
          pinSpacing: true,
        });
      });
    }, rootRef);

    return () => {
      ctx.revert();
      lenis.destroy();
      gsap.ticker.remove(ticker);
    };
  }, [story?.sections?.length]);

  const heroImage = story?.heroImageUrl || category.imageUrl;

  return (
    <div ref={rootRef}>
      {/* Hero */}
      <section className="image-frame-dark relative flex min-h-[85dvh] items-end overflow-hidden">
        {heroImage && (
          <Image
            src={heroImage}
            alt={category.name}
            fill
            priority
            sizes="100vw"
            className="image-fit-contain p-6 sm:p-10 lg:p-14"
            data-hero-image
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/25 to-transparent" />
        <div className="container-page relative z-10 pb-16 pt-32" data-hero-content>
          <p className="text-sm font-medium uppercase tracking-widest text-gold">Collection</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl text-surface sm:text-5xl lg:text-6xl">
            {story?.headline || category.name}
          </h1>
          {story?.subheading && (
            <p className="mt-4 max-w-xl text-base text-surface/90 sm:text-lg">{story.subheading}</p>
          )}
          <Link href={`/category/${category.slug}`} className="mt-8 inline-block">
            <Button variant="secondary" size="lg">
              Shop {category.name}
            </Button>
          </Link>
        </div>
      </section>

      {/* Story sections */}
      {story?.sections?.map((section, i) => (
        <section
          key={section.title}
          data-story-section
          data-pin-section={i === 0 ? true : undefined}
          className="border-b border-border bg-background py-16 sm:py-24"
        >
          <div data-pin-inner={i === 0 ? true : undefined}>
            <div
              className={`container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                section.align === "right" ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div data-story-text className="space-y-4">
                <span className="text-sm font-medium text-gold">0{i + 1}</span>
                <h2 className="font-display text-3xl sm:text-4xl">{section.title}</h2>
                <p className="text-base leading-relaxed text-muted sm:text-lg">{section.body}</p>
              </div>
              <div
                data-story-image
                className="image-frame relative aspect-[4/3] overflow-hidden rounded-lg"
              >
                <Image
                  src={section.imageUrl}
                  alt={section.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="image-fit-contain p-2 sm:p-3"
                />
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Products */}
      {products.length > 0 && (
        <section className="container-page py-8 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="font-display text-2xl sm:text-4xl">From the Collection</h2>
              <p className="mt-1 text-sm text-muted sm:mt-2">Handpicked pieces from {category.name}</p>
            </div>
            <Link href={`/category/${category.slug}`}>
              <Button variant="outline">View all</Button>
            </Link>
          </div>
          <div className="mt-5 product-grid sm:mt-10">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
