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
import { pickBestImage } from "@/lib/pick-best-image";

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
      {/* Featured Collections */}
      {sections.collections.enabled && collections.length > 0 && (
        <section className="texture-surface relative py-6 sm:py-14">
          <div className="container-page">
            <SectionHeader
              title={sections.collections.title}
              description={sections.collections.description}
            />
            <div
              data-collections-grid
              className="perspective-distant mt-4 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-4 lg:grid-cols-4"
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
        <section className="container-page py-6 sm:py-14">
          <SectionHeader
            title={sections.lifestyle.title}
            description={sections.lifestyle.description}
          />
          <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {lifestyleProducts.map((product) => {
              const lifestyle =
                pickBestImage(product.images, "lifestyle") ??
                pickBestImage(product.images) ??
                product.images[0];
              return (
                <div key={product._id} data-lifestyle-card className="perspective-distant">
                  <Link
                    href={`/product/${product.slug}`}
                    aria-label={product.title}
                    className="group flex flex-col overflow-hidden rounded-xl bg-surface shadow-warm transition-shadow duration-500 ease-out hover:shadow-warm-lg sm:rounded-2xl"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#e8e2d8]">
                      {lifestyle ? (
                        <div data-lifestyle-img className="absolute inset-0 will-change-transform">
                          <Image
                            src={lifestyle.url}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            quality={90}
                            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                          />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#d4c9b8] to-[#b8a88e]" />
                      )}
                    </div>
                    <p className="line-clamp-2 p-3 font-display text-sm font-semibold leading-snug text-foreground sm:p-4 sm:text-base">
                      {product.title}
                    </p>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {sections.newArrivals.enabled && newArrivals.length > 0 && (
        <section className="container-page py-6 sm:py-14">
          <SectionHeader
            title={sections.newArrivals.title}
            description={sections.newArrivals.description}
            href={sections.newArrivals.href}
          />
          <div data-product-grid className="product-grid mt-4 sm:mt-8">
            {newArrivals.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {sections.bestSellers.enabled && bestSellers.length > 0 && (
        <section className="texture-cream relative py-6 sm:py-14">
          <div className="container-page">
            <SectionHeader
              title={sections.bestSellers.title}
              description={sections.bestSellers.description}
              href={sections.bestSellers.href}
            />
            <div data-product-grid className="product-grid mt-4 sm:mt-8">
              {bestSellers.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      {sections.whyChooseUs.enabled && brand.whyChooseUs.length > 0 && (
        <section className="texture-bamboo border-y border-border py-6 sm:py-14">
          <div className="container-page">
            <SectionHeader
              title={sections.whyChooseUs.title}
              centered
              className="!flex-col !items-center !text-center"
            />
            <div data-pillars-grid className="mt-8 grid grid-cols-2 gap-6 max-[480px]:gap-x-4 max-[480px]:gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
              {brand.whyChooseUs.map((item, i) => (
                <div
                  key={item.title}
                  data-pillar-card
                  className="pillar-card flex h-full flex-col items-center text-center"
                >
                  <div className="pillar-icon-circle inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <BrandIcon
                      name={item.icon}
                      className={cn("h-4 w-4", i % 2 === 0 ? "text-wood" : "text-gold")}
                    />
                  </div>
                  <h3 className="mt-3 flex min-h-[2.25rem] items-center justify-center text-sm font-semibold leading-tight sm:text-base">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-muted sm:text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brand pillars — lower on page so collections/products appear sooner */}
      {brand.brandPillars.length > 0 && (
        <section className="texture-bamboo relative overflow-hidden py-6 sm:py-14">
          <div className="container-page">
            <div data-pillars-grid className="grid gap-5 sm:grid-cols-3 sm:gap-8">
              {brand.brandPillars.map((pillar, i) => (
                <div key={pillar.title} data-pillar-card className="pillar-card min-w-0 text-center sm:text-left">
                  <div className="pillar-icon-circle inline-flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12">
                    <BrandIcon
                      name={pillar.icon}
                      className={cn(i % 2 === 0 ? "text-wood" : "text-gold")}
                    />
                  </div>
                  <h3 className="mt-2.5 break-words font-display text-base sm:mt-4 sm:text-lg">{pillar.title}</h3>
                  <p className="mt-1 break-words text-sm leading-relaxed text-muted">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Customer Homes */}
      {sections.customerHomes.enabled && customerHomes.length > 0 && (
        <section className="container-page py-6 sm:py-14">
          <SectionHeader
            title={sections.customerHomes.title}
            description={sections.customerHomes.description}
          />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {customerHomes.map((photo) => (
              <figure key={photo._id} data-lifestyle-card className="group overflow-hidden rounded-xl bg-surface shadow-warm sm:rounded-2xl">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#e8e2d8]">
                  <Image
                    src={photo.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    quality={90}
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <figcaption className="p-3 sm:p-4">
                  <span className="block text-sm font-semibold text-foreground">{photo.customerName}</span>
                  {photo.caption && (
                    <span className="mt-0.5 block text-xs text-muted line-clamp-2">{photo.caption}</span>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      {sections.reviews.enabled && reviews.length > 0 && (
        <section className="texture-surface py-6 sm:py-14">
          <div className="container-page">
            <SectionHeader title={sections.reviews.title} />
            <div
              data-reviews-grid
              className={
                reviews.length === 1
                  ? "mt-6 flex justify-center sm:mt-8"
                  : "mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3"
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
        <section className="container-page py-6 sm:py-14">
          <SectionHeader
            title={sections.journal.title}
            description={sections.journal.description}
            href={sections.journal.href}
            linkText={sections.journal.linkText}
          />
          <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-4">
            {blogPosts.map((post) => (
              <Link
                key={post._id}
                href={`/journal/${post.slug}`}
                className="group flex h-full flex-col rounded-xl border border-border bg-surface p-4 shadow-warm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-warm-lg sm:p-5"
              >
                <h3 className="journal-card-title font-display text-base sm:text-lg">{post.title}</h3>
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
        <section className="border-t border-border py-6 sm:py-14">
          <div className="container-page">
            <SectionHeader
              title={sections.gallery.title}
              centered
              className="!flex-col !items-center !text-center"
            />
            <div className="mt-6 grid grid-cols-3 gap-1.5 sm:mt-8 sm:grid-cols-4 lg:grid-cols-6">
              {gallery.map((item) => {
                const img = (
                  <Image
                    src={item.imageUrl}
                    alt={item.caption || "Bamboo Eco-Hub"}
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
