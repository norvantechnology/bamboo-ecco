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

  // Build full keyword-rich homepage title: "Bamboo Eco-Hub | Handcrafted Bamboo Furniture & Home Decor Online India"
  // We pass seo.defaultTitle as the title so the root layout template produces "defaultTitle | BrandName"
  // OR if defaultTitle is empty, fall back to brand tagline
  const titleSuffix = seo.defaultTitle || brand?.tagline || "";
  const fullTitle = titleSuffix
    ? `${seo.name || brand?.name} | ${titleSuffix}`
    : (seo.name || brand?.name || "Home");

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
