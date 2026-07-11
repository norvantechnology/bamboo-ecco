import type { Metadata } from "next";
import { HeroBanner } from "@/components/home/hero-banner";
import { HomePageClient } from "@/components/home/home-page-client";
import { getHomepage } from "@/lib/api";
import { getDefaultHomepageData } from "@/lib/homepage-fallback";
import { buildPageMetadata } from "@/lib/seo";
import { resolveSiteSeo } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getHomepage().catch(() => null);
  const brand = data?.brand;
  const seo = await resolveSiteSeo();
  return buildPageMetadata({
    title: brand?.name ?? seo.name,
    description: brand?.tagline ?? brand?.hero?.subheading ?? seo.description,
    path: "/",
    image: brand?.hero?.imageUrl,
    imageAlt: brand?.hero?.headline,
  });
}

export default async function HomePage() {
  const data = await getHomepage().catch(() => getDefaultHomepageData());
  const { brand } = data;

  return (
    <>
      <HeroBanner
        imageUrl={brand.hero.imageUrl}
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
