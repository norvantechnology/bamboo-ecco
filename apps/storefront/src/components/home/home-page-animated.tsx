"use client";

import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { BrandIcon } from "@/components/ui/brand-icon";
import { StarRating } from "@/components/ui/star-rating";
import { SectionHeader } from "@/components/ui/section-header";
import { CollectionCard3D } from "@/components/home/collection-card-3d";
import { HomeMotionRoot } from "@/components/home/home-motion";
import type { getHomepage } from "@/lib/api";
import { cn } from "@/lib/utils";

type HomeData = Awaited<ReturnType<typeof getHomepage>>;

export function HomePageAnimated({ data }: { data: HomeData }) {
  const {
    brand,
    sections,
    collections,
    bestSellers,
    newArrivals,
    lifestyleProducts,
    reviews,
    customerHomes,
    gallery,
    blogPosts,
  } = data;

  return (
    <HomeMotionRoot>
      {/* Brand pillars */}
      {brand.brandPillars.length > 0 && (
        <section className="texture-bamboo relative overflow-hidden py-16 sm:py-24">
          <div className="container-page">
            <div data-pillars-grid className="grid gap-10 sm:grid-cols-3">
              {brand.brandPillars.map((pillar, i) => (
                <div key={pillar.title} data-pillar-card className="pillar-card text-center sm:text-left">
                  <div className="pillar-icon-circle inline-flex h-14 w-14 items-center justify-center rounded-full">
                    <BrandIcon
                      name={pillar.icon}
                      className={cn(i % 2 === 0 ? "text-wood" : "text-gold")}
                    />
                  </div>
                  <h3 className="mt-5 font-display text-xl">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Collections */}
      {sections.collections.enabled && collections.length > 0 && (
        <section className="texture-surface relative py-16 sm:py-24">
          <div className="container-page">
            <SectionHeader
              label={sections.collections.label}
              title={sections.collections.title}
              description={sections.collections.description}
            />
            <div
              data-collections-grid
              className="perspective-distant mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
            >
              {collections.map((cat, i) => (
                <CollectionCard3D key={cat._id} category={cat} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lifestyle */}
      {sections.lifestyle.enabled && lifestyleProducts.length > 0 && (
        <section className="container-page py-16 sm:py-24">
          <SectionHeader
            label={sections.lifestyle.label}
            title={sections.lifestyle.title}
            description={sections.lifestyle.description}
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {lifestyleProducts.map((product) => {
              const lifestyle = product.images.find((img) => img.type === "lifestyle") ?? product.images[0];
              return (
                <div key={product._id} data-lifestyle-card className="perspective-distant">
                  <Link
                    href={`/product/${product.slug}`}
                    className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-[#e8e2d8] shadow-warm transition-shadow duration-500 ease-out hover:shadow-warm-lg"
                  >
                    {lifestyle ? (
                      <div data-lifestyle-img className="absolute inset-0 will-change-transform">
                        <Image
                          src={lifestyle.url}
                          alt={lifestyle.alt}
                          fill
                          sizes="33vw"
                          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#d4c9b8] to-[#b8a88e]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/85 via-[#1a1410]/15 to-transparent transition-all duration-300 ease-out group-hover:from-[#1a1410]/92" />
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                      <p className="font-display text-lg font-semibold leading-snug text-white sm:text-xl">
                        {product.title}
                      </p>
                      <span className="lifestyle-cta mt-2 inline-block text-xs font-medium uppercase tracking-wider text-gold">
                        View product →
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {sections.newArrivals.enabled && newArrivals.length > 0 && (
        <section className="container-page py-16 sm:py-24">
          <SectionHeader
            label={sections.newArrivals.label}
            title={sections.newArrivals.title}
            description={sections.newArrivals.description}
            href={sections.newArrivals.href}
          />
          <div data-product-grid className="product-grid mt-10">
            {newArrivals.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {sections.bestSellers.enabled && bestSellers.length > 0 && (
        <section className="texture-cream relative py-16 sm:py-24">
          <div className="container-page">
            <SectionHeader
              label={sections.bestSellers.label}
              title={sections.bestSellers.title}
              description={sections.bestSellers.description}
              href={sections.bestSellers.href}
            />
            <div data-product-grid className="product-grid mt-10">
              {bestSellers.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      {sections.whyChooseUs.enabled && brand.whyChooseUs.length > 0 && (
        <section className="texture-bamboo border-y border-border py-16 sm:py-24">
          <div className="container-page">
            <SectionHeader
              label={sections.whyChooseUs.label}
              title={sections.whyChooseUs.title}
              centered
              className="!flex-col !items-center !text-center"
            />
            <div data-pillars-grid className="mt-12 grid grid-cols-2 gap-8 max-[480px]:gap-x-4 max-[480px]:gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
              {brand.whyChooseUs.map((item, i) => (
                <div
                  key={item.title}
                  data-pillar-card
                  className="pillar-card flex h-full flex-col items-center text-center"
                >
                  <div className="pillar-icon-circle inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                    <BrandIcon
                      name={item.icon}
                      className={cn("h-4 w-4", i % 2 === 0 ? "text-wood" : "text-gold")}
                    />
                  </div>
                  <h3 className="mt-4 flex min-h-[2.5rem] items-center justify-center text-base font-semibold leading-tight">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm font-medium leading-relaxed text-muted">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Customer Homes */}
      {sections.customerHomes.enabled && customerHomes.length > 0 && (
        <section className="container-page py-16 sm:py-24">
          <SectionHeader
            label={sections.customerHomes.label}
            title={sections.customerHomes.title}
            description={sections.customerHomes.description}
          />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {customerHomes.map((photo) => (
              <figure key={photo._id} data-lifestyle-card className="group">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#e8e2d8] shadow-warm transition-shadow duration-500 group-hover:shadow-warm-lg">
                  <Image
                    src={photo.imageUrl}
                    alt={photo.caption || photo.customerName}
                    fill
                    sizes="25vw"
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1410]/70 via-transparent to-transparent" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-4">
                    <span className="block text-sm font-semibold text-white">{photo.customerName}</span>
                    {photo.caption && (
                      <span className="mt-0.5 block text-xs text-white/80 line-clamp-2">{photo.caption}</span>
                    )}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      {sections.reviews.enabled && reviews.length > 0 && (
        <section className="texture-surface py-16 sm:py-24">
          <div className="container-page">
            <SectionHeader label={sections.reviews.label} title={sections.reviews.title} />
            <div
              data-reviews-grid
              className={
                reviews.length === 1
                  ? "mt-10 flex justify-center"
                  : "mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              }
            >
              {reviews.map((review) => (
                <blockquote
                  key={review._id}
                  data-review-card
                  className={`h-full rounded-xl border border-border bg-background p-6 shadow-warm ${
                    reviews.length === 1 ? "w-full max-w-xl" : ""
                  }`}
                >
                  <StarRating rating={review.rating} />
                  <p className="mt-4 text-base leading-relaxed">&ldquo;{review.body}&rdquo;</p>
                  <footer className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                    {review.photos[0] && (
                      <div className="relative h-10 w-10 overflow-hidden rounded-full">
                        <Image src={review.photos[0]} alt="" fill className="object-cover" />
                      </div>
                    )}
                    <cite className="text-base font-semibold not-italic">{review.reviewerName}</cite>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Journal */}
      {sections.journal.enabled && blogPosts.length > 0 && (
        <section className="container-page py-16 sm:py-24">
          <SectionHeader
            label={sections.journal.label}
            title={sections.journal.title}
            description={sections.journal.description}
            href={sections.journal.href}
            linkText={sections.journal.linkText}
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {blogPosts.map((post) => (
              <Link
                key={post._id}
                href={`/journal/${post.slug}`}
                className="group flex h-full flex-col rounded-xl border border-border bg-surface p-6 shadow-warm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-warm-lg"
              >
                <h3 className="journal-card-title font-display text-lg">{post.title}</h3>
                <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted">{post.meta?.description}</p>
                <span className="mt-4 text-xs font-medium text-secondary opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
                  Read article →
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Gallery / Instagram */}
      {sections.gallery.enabled && gallery.length > 0 && (
        <section className="border-t border-border py-16 sm:py-24">
          <div className="container-page">
            <SectionHeader
              label={sections.gallery.label}
              title={sections.gallery.title}
              centered
              className="!flex-col !items-center !text-center"
            />
            <div className="mt-10 grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
              {gallery.map((item) => {
                const img = (
                  <Image
                    src={item.imageUrl}
                    alt={item.caption || "Terra Living"}
                    fill
                    sizes="16vw"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                );
                return (
                  <div key={item._id} className="group relative aspect-square overflow-hidden rounded-xl bg-[#e8e2d8]">
                    {item.instagramUrl ? (
                      <a href={item.instagramUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0">
                        {img}
                      </a>
                    ) : (
                      img
                    )}
                    <div className="absolute inset-0 bg-secondary/0 transition-colors duration-300 group-hover:bg-secondary/20" />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </HomeMotionRoot>
  );
}
