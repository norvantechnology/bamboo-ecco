import type { Metadata } from "next";
import { HeroBanner } from "@/components/home/hero-banner";
import { HomePageClient } from "@/components/home/home-page-client";
import { getHomepage } from "@/lib/api";
import { buildPageMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getHomepage().catch(() => null);
  const brand = data?.brand;
  return buildPageMetadata({
    title: brand?.name ?? "Terra Living",
    description: brand?.tagline ?? brand?.hero?.subheading,
    path: "/",
    image: brand?.hero?.imageUrl,
    imageAlt: brand?.hero?.headline,
  });
}

export default async function HomePage() {
  const data = await getHomepage();
  const { brand } = data;

  const jsonLd = [organizationJsonLd({ name: brand.name, tagline: brand.tagline }), websiteJsonLd()];

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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
