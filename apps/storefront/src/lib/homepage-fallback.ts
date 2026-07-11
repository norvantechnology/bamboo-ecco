import type { HomepageData } from "./api";
import { DEFAULT_HOMEPAGE_SECTIONS } from "./homepage-sections";
import { SITE_SEO_FALLBACK } from "./site";

/** Used when the API is unreachable during build or at runtime. */
export function getDefaultHomepageData(): HomepageData {
  return {
    brand: {
      name: SITE_SEO_FALLBACK.name,
      tagline: SITE_SEO_FALLBACK.description,
      theme: {
        background: SITE_SEO_FALLBACK.backgroundColor.toLowerCase(),
        primary: SITE_SEO_FALLBACK.themeColor.toLowerCase(),
        secondary: "#8b7355",
        text: "#1a1a1a",
        gold: "#c9a962",
      },
      hero: {
        headline: "Natural Living, Beautifully Crafted",
        subheading: SITE_SEO_FALLBACK.description,
        primaryCta: "Shop Now",
        secondaryCta: "Explore Collections",
      },
      brandPillars: [],
      whyChooseUs: [],
    },
    sections: DEFAULT_HOMEPAGE_SECTIONS,
    collections: [],
    bestSellers: [],
    lifestyleProducts: [],
    newArrivals: [],
    reviews: [],
    customerHomes: [],
    gallery: [],
    blogPosts: [],
  };
}
