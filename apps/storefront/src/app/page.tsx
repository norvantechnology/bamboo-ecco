import type { Metadata } from "next";
import { HeroBanner } from "@/components/home/hero-banner";
import { HomePageClient } from "@/components/home/home-page-client";
import { JsonLd } from "@/components/seo/json-ld";
import { getHomepage, type HomepageData } from "@/lib/api";
import { buildPageMetadata, homePageJsonLd } from "@/lib/seo";
import { resolveSiteSeo } from "@/lib/site";

const DEFAULT_BRAND_FALLBACK = {
  name: "Bamboo Eco-Hub",
  tagline: "Handcrafted Bamboo Furniture & Eco-Friendly Home Decor Online in India",
  hero: {
    headline: "Handcrafted Bamboo Furniture & Eco-Friendly Home Decor Online in India",
    subheading: "Shop sustainable bamboo home decor, space-saving furniture, and natural living accents — delivered across India.",
    imageUrl: "https://res.cloudinary.com/ddkubtgk0/image/upload/v1783786822/Gemini_Generated_Image_gh71v7gh71v7gh71_ysoamv.png",
    imageUrls: ["https://res.cloudinary.com/ddkubtgk0/image/upload/v1783786822/Gemini_Generated_Image_gh71v7gh71v7gh71_ysoamv.png"],
    mobileImageUrls: [],
    primaryCta: "Shop Bamboo Decor",
    secondaryCta: "Explore Collections",
  },
  theme: {
    background: "#FAF8F3",
    primary: "#4B3621",
    secondary: "#7A8F6B",
    text: "#2E2E2E",
    gold: "#C4A962",
  },
  brandPillars: [],
  whyChooseUs: [],
};

const DEFAULT_HOMEPAGE_FALLBACK: HomepageData = {
  brand: DEFAULT_BRAND_FALLBACK,
  sections: {
    collections: { enabled: true, label: "Collections", title: "Bamboo Home Decor Collections", description: "Explore curated bamboo furniture and natural decor", limit: 8 },
    lifestyle: { enabled: true, label: "Lifestyle", title: "Bamboo Furniture in Real Indian Homes", description: "Eco-friendly pieces for living rooms and bedrooms", limit: 6 },
    newArrivals: { enabled: true, label: "Just landed", title: "New Bamboo Decor & Furniture", description: "Fresh handcrafted bamboo pieces", href: "/new-arrivals", limit: 24 },
    bestSellers: { enabled: true, label: "Popular", title: "Best-Selling Bamboo Home Decor", description: "Our most-loved sustainable furniture and decor", href: "/best-sellers", limit: 24 },
    whyChooseUs: { enabled: true, label: "Our promise", title: "Why Choose Us" },
    customerHomes: { enabled: true, label: "Community", title: "Customer Homes", description: "Real Indian homes styled with natural bamboo decor", limit: 8 },
    reviews: { enabled: true, label: "Reviews", title: "Customer Reviews — Bamboo Furniture & Decor", limit: 6 },
    journal: { enabled: true, label: "Journal", title: "Bamboo & Sustainable Living Ideas", description: "Tips on eco-friendly home decor and bamboo furniture care", href: "/journal", linkText: "Read all", limit: 4 },
    gallery: { enabled: true, label: "Instagram", title: "Follow Our Journey", limit: 12 },
  },
  collections: [],
  categoryTree: [],
  bestSellers: [],
  lifestyleProducts: [],
  newArrivals: [],
  reviews: [],
  customerHomes: [],
  gallery: [],
  blogPosts: [],
};

export async function generateMetadata(): Promise<Metadata> {
  const [data, seo] = await Promise.all([
    getHomepage().catch(() => null),
    resolveSiteSeo(),
  ]);
  const brand = data?.brand || DEFAULT_BRAND_FALLBACK;

  const siteName = seo.name || brand.name || "Bamboo Eco-Hub";
  const titleSuffix = seo.defaultTitle || brand.tagline || "";
  const raw = titleSuffix ? `${siteName} | ${titleSuffix}` : siteName;
  const fullTitle = raw.length > 58 ? `${siteName} | Handcrafted Furniture & Home Decor India` : raw;

  const desc = seo.description || brand.tagline || brand.hero.subheading || "";

  const heroList = (brand.hero.imageUrls ?? []).filter((u): u is string => Boolean(u && u.trim()));
  if (!heroList.length && brand.hero.imageUrl?.trim()) {
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
    imageAlt: brand.hero.headline || fullTitle,
    absoluteTitle: true,
  });
}

export default async function HomePage() {
  const dataRaw = await getHomepage().catch(() => null);
  const data = dataRaw?.brand ? dataRaw : DEFAULT_HOMEPAGE_FALLBACK;
  const { brand } = data;
  const heroImages = (brand.hero.imageUrls ?? []).filter((u): u is string => Boolean(u && u.trim()));
  if (!heroImages.length && brand.hero.imageUrl?.trim()) {
    heroImages.push(brand.hero.imageUrl.trim());
  }

  return (
    <>
      <JsonLd
        data={homePageJsonLd({
          name: brand.name,
          description: brand.tagline || brand.hero.subheading,
          image: heroImages[0],
        })}
      />
      {/* Server-rendered H1 for SEO crawlers (visually hidden, hero shows styled version) */}
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
