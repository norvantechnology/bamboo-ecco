import type { Metadata } from "next";
import { HeroBanner } from "@/components/home/hero-banner";
import { HomePageClient } from "@/components/home/home-page-client";
import { getHomepage } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";
import { resolveSiteSeo } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [data, seo] = await Promise.all([
    getHomepage().catch(() => null),
    resolveSiteSeo(),
  ]);
  const brand = data?.brand;
  return buildPageMetadata({
    title: brand?.name || seo.name || "Home",
    description: brand?.tagline ?? brand?.hero?.subheading ?? seo.description,
    path: "/",
    image: brand?.hero?.imageUrls?.[0] || brand?.hero?.imageUrl,
    imageAlt: brand?.hero?.headline,
  });
}

export default async function HomePage() {
  const data = await getHomepage().catch(() => null);

  if (!data?.brand) {
    return (
      <div className="container-page flex min-h-[40vh] flex-col items-center justify-center py-16 text-center">
        <p className="text-muted">Store content is temporarily unavailable.</p>
      </div>
    );
  }

  const { brand } = data;

  return (
    <>
      <HeroBanner
        imageUrl={brand.hero.imageUrl}
        mobileImageUrl={brand.hero.mobileImageUrl}
        imageUrls={brand.hero.imageUrls}
        mobileImageUrls={brand.hero.mobileImageUrls}
        headline={brand.hero.headline}
        tagline={brand.tagline}
        subheading={brand.hero.subheading}
        primaryCta={brand.hero.primaryCta}
        secondaryCta={brand.hero.secondaryCta}
      />

      <HomePageClient data={data} welcomePopup={data.promotions?.welcomePopup} />
    </>
  );
}
