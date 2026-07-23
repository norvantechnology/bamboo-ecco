import type { HomepageSections } from "./api";

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSections = {
  collections: { enabled: true, label: "Collections", title: "Bamboo Home Decor Collections", description: "Explore curated bamboo furniture and natural decor for every room", limit: 8 },
  lifestyle: { enabled: true, label: "Lifestyle", title: "Bamboo Furniture in Real Indian Homes", description: "See how our eco-friendly pieces look in living rooms, bedrooms, and apartments", limit: 6 },
  newArrivals: { enabled: true, label: "Just landed", title: "New Bamboo Decor & Furniture", description: "Fresh handcrafted bamboo pieces — just added to our online store", href: "/new-arrivals", limit: 24 },
  bestSellers: { enabled: true, label: "Popular", title: "Best-Selling Bamboo Home Decor", description: "Our most-loved sustainable furniture and decor, chosen by customers across India", href: "/best-sellers", limit: 24 },
  whyChooseUs: { enabled: true, label: "Our promise", title: "Why Choose Us" },
  customerHomes: { enabled: true, label: "Community", title: "Customer Homes", description: "Real Indian homes styled with natural bamboo decor", limit: 8 },
  reviews: { enabled: true, label: "Reviews", title: "Customer Reviews — Bamboo Furniture & Decor", limit: 6 },
  journal: { enabled: true, label: "Journal", title: "Bamboo & Sustainable Living Ideas", description: "Tips on eco-friendly home decor, bamboo furniture care, and mindful interiors", href: "/journal", linkText: "Read all", limit: 4 },
  gallery: { enabled: true, label: "Instagram", title: "Follow Our Journey", limit: 12 },
};

export function withHomepageSections<T extends { sections?: HomepageSections }>(data: T): T & { sections: HomepageSections } {
  return { ...data, sections: data.sections ?? DEFAULT_HOMEPAGE_SECTIONS };
}
