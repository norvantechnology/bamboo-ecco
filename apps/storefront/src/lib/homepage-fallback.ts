import type { HomepageData } from "./api";
import { DEFAULT_HOMEPAGE_SECTIONS } from "./homepage-sections";

const DEFAULT_THEME = {
  background: "#faf8f5",
  primary: "#2c4a3e",
  secondary: "#8b7355",
  text: "#1a1a1a",
  gold: "#c9a962",
};

/** Used when the API is unreachable during build or at runtime. */
export function getDefaultHomepageData(): HomepageData {
  return {
    brand: {
      name: "Terra Living",
      tagline: "Handcrafted bamboo furniture & eco-friendly home decor",
      theme: DEFAULT_THEME,
      hero: {
        headline: "Natural Living, Beautifully Crafted",
        subheading: "Sustainable bamboo furniture and decor for modern Indian homes",
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
