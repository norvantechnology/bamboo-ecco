"use client";

import Image from "next/image";
import Link from "next/link";
import { ProductCarousel } from "@/components/product/product-carousel";
import { BrandIcon } from "@/components/ui/brand-icon";
import { StarRating } from "@/components/ui/star-rating";
import { SectionHeader } from "@/components/ui/section-header";
import { CollectionCard3D } from "@/components/home/collection-card-3d";
import { HomeMotionRoot } from "@/components/home/home-motion";
import { MotionReveal, MotionStaggerContainer, MotionStaggerChild, childFadeUpVariants } from "@/components/ui/motion-reveal";
import type { getHomepage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { pickBestImage } from "@/lib/pick-best-image";
import { motion } from "framer-motion";

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
      {/* 1. Featured Collections ("Shop Bamboo Home Decor Collections") */}
      {sections.collections.enabled && collections.length > 0 && (
        <section className="texture-surface relative py-6 sm:py-14">
          <div className="container-page">
            <MotionReveal>
              <SectionHeader
                title={sections.collections.title}
                description={sections.collections.description}
              />
            </MotionReveal>
            <MotionStaggerContainer
              data-collections-grid
              staggerDelay={0.08}
              className="perspective-distant mt-4 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-4 lg:grid-cols-4"
            >
              {collections.map((cat, i) => (
                <MotionStaggerChild key={cat._id} variants={childFadeUpVariants}>
                  <CollectionCard3D category={cat} index={i} />
                </MotionStaggerChild>
              ))}
            </MotionStaggerContainer>
          </div>
        </section>
      )}

      {/* 2. Lifestyle Products Grid */}
      {sections.lifestyle.enabled && lifestyleProducts.length > 0 && (
        <section className="container-page py-6 sm:py-14">
          <MotionReveal>
            <SectionHeader
              title={sections.lifestyle.title}
              description={sections.lifestyle.description}
            />
          </MotionReveal>
          <MotionStaggerContainer
            staggerDelay={0.09}
            className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-4 lg:grid-cols-3"
          >
            {lifestyleProducts.map((product) => {
              const lifestyle =
                pickBestImage(product.images, "lifestyle") ??
                pickBestImage(product.images) ??
                product.images[0];
              return (
                <MotionStaggerChild key={product._id} variants={childFadeUpVariants} className="perspective-distant">
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
                            quality={75}
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
                </MotionStaggerChild>
              );
            })}
          </MotionStaggerContainer>
        </section>
      )}

      {/* 3. New Arrivals ("New Bamboo Decor & Furniture") */}
      {sections.newArrivals.enabled && newArrivals.length > 0 && (
        <section className="container-page py-6 sm:py-14">
          <SectionHeader
            title={sections.newArrivals.title}
            description={sections.newArrivals.description}
            href={sections.newArrivals.href}
          />
          <div className="mt-4 sm:mt-8">
            <ProductCarousel products={newArrivals} />
          </div>
        </section>
      )}

      {/* 4. Best Sellers ("Best-Selling Bamboo Home Decor") */}
      {sections.bestSellers.enabled && bestSellers.length > 0 && (
        <section className="texture-cream relative py-6 sm:py-14">
          <div className="container-page">
            <SectionHeader
              title={sections.bestSellers.title}
              description={sections.bestSellers.description}
              href={sections.bestSellers.href}
            />
            <div className="mt-4 sm:mt-8">
              <ProductCarousel products={bestSellers} />
            </div>
          </div>
        </section>
      )}

      {/* 5. Why Choose Us ("Our Promise") */}
      {sections.whyChooseUs.enabled && brand.whyChooseUs.length > 0 && (
        <section className="texture-bamboo border-y border-border py-8 sm:py-16">
          <div className="container-page">
            <MotionReveal className="flex flex-col items-center text-center mb-10 sm:mb-12">
              <span className="section-label !mb-2">Our Promise</span>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl lg:text-4xl text-foreground relative pb-4">
                Why Choose Bamboo Eco-Hub
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "80px" }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] bg-gradient-to-r from-[#4A5D3E] to-[#C9A24B] rounded-full"
                />
              </h2>
              <p className="mt-3.5 max-w-xl text-xs sm:text-sm text-muted">
                Sustainably crafted home decor designed to bring natural warmth, elegance, and durability to your living space.
              </p>
            </MotionReveal>

            <MotionStaggerContainer
              staggerDelay={0.09}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {brand.whyChooseUs.map((item) => (
                <MotionStaggerChild
                  key={item.title}
                  variants={childFadeUpVariants}
                  className="group relative flex flex-col items-center text-center rounded-2xl border border-border/60 dark:border-border bg-surface/85 dark:bg-surface-elevated/90 p-6 sm:p-8 shadow-warm hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-1.5"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4A5D3E] to-[#C9A24B] shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <BrandIcon
                      name={item.icon}
                      className="h-6 w-6 text-[#FAF8F5] transition-transform duration-300 group-hover:rotate-6"
                    />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
                    {item.description}
                  </p>
                </MotionStaggerChild>
              ))}
            </MotionStaggerContainer>
          </div>
        </section>
      )}

      {/* 6. Brand Pillars */}
      {brand.brandPillars.length > 0 && (
        <section className="texture-bamboo relative overflow-hidden py-6 sm:py-14">
          <div className="container-page">
            <MotionStaggerContainer staggerDelay={0.08} className="grid grid-cols-3 gap-3 sm:gap-8">
              {brand.brandPillars.map((pillar, i) => (
                <MotionStaggerChild key={pillar.title} variants={childFadeUpVariants} className="pillar-card min-w-0 text-center">
                  <div className="pillar-icon-circle inline-flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12">
                    <BrandIcon
                      name={pillar.icon}
                      className={cn(i % 2 === 0 ? "text-wood" : "text-gold")}
                    />
                  </div>
                  <h3 className="mt-2.5 break-words font-display text-base sm:mt-4 sm:text-lg">{pillar.title}</h3>
                  <p className="hidden sm:block mt-1 break-words text-sm leading-relaxed text-muted">{pillar.description}</p>
                </MotionStaggerChild>
              ))}
            </MotionStaggerContainer>
          </div>
        </section>
      )}

      {/* 7. Customer Homes (UGC Photo Grid) */}
      {sections.customerHomes.enabled && customerHomes.length > 0 && (
        <section className="container-page py-6 sm:py-14">
          <MotionReveal>
            <SectionHeader
              title={sections.customerHomes.title}
              description={sections.customerHomes.description}
            />
          </MotionReveal>
          <MotionStaggerContainer
            staggerDelay={0.08}
            className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
          >
            {customerHomes.map((photo) => (
              <MotionStaggerChild key={photo._id} variants={childFadeUpVariants}>
                <figure className="group overflow-hidden rounded-xl bg-surface shadow-warm sm:rounded-2xl">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#e8e2d8]">
                    <Image
                      src={photo.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      quality={75}
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <figcaption className="p-3 sm:p-4">
                    <span className="block text-sm font-semibold text-foreground">{photo.customerName}</span>
                    {photo.caption && (
                      <span className="hidden sm:block mt-0.5 text-xs text-muted line-clamp-2">{photo.caption}</span>
                    )}
                  </figcaption>
                </figure>
              </MotionStaggerChild>
            ))}
          </MotionStaggerContainer>
        </section>
      )}

      {/* 8. Customer Reviews ("What Our Customers Say") */}
      {sections.reviews.enabled && reviews.length > 0 && (
        <section className="texture-surface py-6 sm:py-14">
          <div className="container-page">
            <MotionReveal>
              <SectionHeader title={sections.reviews.title} />
            </MotionReveal>
            <MotionStaggerContainer
              staggerDelay={0.09}
              className={
                reviews.length === 1
                  ? "mt-6 flex justify-center sm:mt-8"
                  : "mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3"
              }
            >
              {reviews.map((review) => (
                <MotionStaggerChild
                  key={review._id}
                  variants={childFadeUpVariants}
                  className={`h-full rounded-xl border border-border bg-background p-4 sm:p-6 shadow-warm ${
                    reviews.length === 1 ? "w-full max-w-xl" : ""
                  }`}
                >
                  <blockquote className="h-full flex flex-col">
                    <StarRating rating={review.rating} />
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed sm:mt-4 sm:text-base">&ldquo;{review.body}&rdquo;</p>
                    <footer className="mt-auto pt-5 flex items-center gap-3 border-t border-border mt-4">
                      {review.photos[0] && (
                        <div className="relative h-10 w-10 overflow-hidden rounded-full shrink-0">
                          <Image src={review.photos[0]} alt="" fill className="object-cover" />
                        </div>
                      )}
                      <cite className="text-base font-semibold not-italic">{review.reviewerName}</cite>
                    </footer>
                  </blockquote>
                </MotionStaggerChild>
              ))}
            </MotionStaggerContainer>
          </div>
        </section>
      )}

      {/* 9. Journal / Blog Posts */}
      {sections.journal.enabled && blogPosts.length > 0 && (
        <section className="container-page py-6 sm:py-14">
          <MotionReveal>
            <SectionHeader
              title={sections.journal.title}
              description={sections.journal.description}
              href={sections.journal.href}
              linkText={sections.journal.linkText}
            />
          </MotionReveal>
          <MotionStaggerContainer
            staggerDelay={0.08}
            className="mt-6 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-4 lg:grid-cols-4"
          >
            {blogPosts.map((post) => (
              <MotionStaggerChild key={post._id} variants={childFadeUpVariants}>
                <Link
                  href={`/journal/${post.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-border bg-surface p-4 shadow-warm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-warm-lg sm:p-5"
                >
                  <h3 className="journal-card-title font-display text-base sm:text-lg">{post.title}</h3>
                  <p className="hidden sm:block mt-2 line-clamp-2 flex-1 text-sm text-muted">{post.meta?.description}</p>
                  <span className="mt-4 text-xs font-medium text-secondary opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
                    Read article →
                  </span>
                </Link>
              </MotionStaggerChild>
            ))}
          </MotionStaggerContainer>
        </section>
      )}

      {/* 10. Instagram Gallery Grid */}
      {sections.gallery.enabled && gallery.length > 0 && (
        <section className="border-t border-border py-6 sm:py-14">
          <div className="container-page">
            <MotionReveal>
              <SectionHeader
                title={sections.gallery.title}
                centered
                className="!flex-col !items-center !text-center"
              />
            </MotionReveal>
            <MotionStaggerContainer
              staggerDelay={0.06}
              className="mt-6 grid grid-cols-3 gap-1.5 sm:mt-8 sm:grid-cols-4 lg:grid-cols-6"
            >
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
                  <MotionStaggerChild key={item._id} variants={childFadeUpVariants}>
                    <div className="group relative aspect-square overflow-hidden rounded-xl bg-[#e8e2d8]">
                      {item.instagramUrl ? (
                        <a href={item.instagramUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0">
                          {img}
                        </a>
                      ) : (
                        img
                      )}
                      <div className="absolute inset-0 bg-secondary/0 transition-colors duration-300 group-hover:bg-secondary/20" />
                    </div>
                  </MotionStaggerChild>
                );
              })}
            </MotionStaggerContainer>
          </div>
        </section>
      )}
    </HomeMotionRoot>
  );
}
