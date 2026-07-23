export interface HomepageSectionConfig {
  enabled: boolean;
  label: string;
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
  limit?: number;
}

export type HomepageSectionsMap = {
  collections: HomepageSectionConfig;
  lifestyle: HomepageSectionConfig;
  newArrivals: HomepageSectionConfig;
  bestSellers: HomepageSectionConfig;
  whyChooseUs: HomepageSectionConfig;
  customerHomes: HomepageSectionConfig;
  reviews: HomepageSectionConfig;
  journal: HomepageSectionConfig;
  gallery: HomepageSectionConfig;
};

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionsMap = {
  collections: {
    enabled: true,
    label: 'Collections',
    title: 'Bamboo Home Decor Collections',
    description: 'Explore curated bamboo furniture and natural decor for every room',
    limit: 8,
  },
  lifestyle: {
    enabled: true,
    label: 'Lifestyle',
    title: 'Bamboo Furniture in Real Indian Homes',
    description: 'See how our eco-friendly pieces look in living rooms, bedrooms, and apartments',
    limit: 6,
  },
  newArrivals: {
    enabled: true,
    label: 'Just landed',
    title: 'New Bamboo Decor & Furniture',
    description: 'Fresh handcrafted bamboo pieces — just added to our online store',
    href: '/new-arrivals',
    limit: 24,
  },
  bestSellers: {
    enabled: true,
    label: 'Popular',
    title: 'Best-Selling Bamboo Home Decor',
    description: 'Our most-loved sustainable furniture and decor, chosen by customers across India',
    href: '/best-sellers',
    limit: 24,
  },
  whyChooseUs: {
    enabled: true,
    label: 'Our promise',
    title: 'Why Choose Us',
  },
  customerHomes: {
    enabled: true,
    label: 'Community',
    title: 'Customer Homes',
    description: 'Real spaces, real stories',
    limit: 8,
  },
  reviews: {
    enabled: true,
    label: 'Reviews',
    title: 'What Our Customers Say',
    limit: 6,
  },
  journal: {
    enabled: true,
    label: 'Journal',
    title: 'Bamboo & Sustainable Living Ideas',
    description: 'Tips on eco-friendly home decor, bamboo furniture care, and mindful interiors',
    href: '/journal',
    linkText: 'Read all',
    limit: 4,
  },
  gallery: {
    enabled: true,
    label: 'Instagram',
    title: 'Follow Our Journey',
    limit: 12,
  },
};

export function resolveHomepageSections(
  stored?: Partial<Record<keyof HomepageSectionsMap, Partial<HomepageSectionConfig>>>,
): HomepageSectionsMap {
  const resolved = {} as HomepageSectionsMap;
  for (const key of Object.keys(DEFAULT_HOMEPAGE_SECTIONS) as (keyof HomepageSectionsMap)[]) {
    resolved[key] = {
      ...DEFAULT_HOMEPAGE_SECTIONS[key],
      ...(stored?.[key] ?? {}),
    };
  }
  return resolved;
}
