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

  // Shortened title to stay under 580px (~55 chars)
  // Old: "Bamboo Eco-Hub | Handcrafted Bamboo Furniture & Home Decor Online India" (702px)
  // New: "Bamboo Eco-Hub | Bamboo Furniture & Home Decor India" (~530px)
  const siteName = seo.name || brand?.name || "Bamboo Eco-Hub";
  const titleSuffix = seo.defaultTitle || brand?.tagline || "";
  // Truncate combined title to ~55 chars for safe pixel width
  const raw = titleSuffix ? `${siteName} | ${titleSuffix}` : siteName;
  const fullTitle = raw.length > 58 ? `${siteName} | Bamboo Furniture & Home Decor India` : raw;

  // Use SEO description from Admin Panel, fall back to tagline
  const desc = seo.description || brand?.tagline || brand?.hero?.subheading || "";

  // Use the stored og:image or fall back to all dynamic hero banner images
  const heroList = (brand?.hero?.imageUrls ?? []).filter((u): u is string => Boolean(u && u.trim()));
  if (!heroList.length && brand?.hero?.imageUrl?.trim()) {
    heroList.push(brand.hero.imageUrl.trim());
  }
  const ogImage = seo.ogImage || heroList[0];
  const allImages = [seo.ogImage, ...heroList].filter((u): u is string => Boolean(u && u.trim()));

  return buildPageMetadata({
    title: fullTitle,
    description: desc,
    keywords: seo.keywords,
    path: "/",
    image: ogImage,
    images: allImages.length ? allImages : undefined,
    imageAlt: brand?.hero?.headline || fullTitle,
    absoluteTitle: true,
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
      {/* Server-rendered H1 for SEO crawlers (visually hidden, hero shows the styled version) */}
      <h1 className="sr-only">{brand.hero.headline}</h1>

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
