import type { AnnouncementBarConfig, Category, FooterLinks } from "./api";
import { getApiUrl, getTenantDomain } from "./api-config";
import { fetchWithTimeout } from "./fetch-with-timeout";

const IS_DEV = process.env.NODE_ENV === "development";

export interface LayoutSeo {
  description: string;
  defaultTitle: string;
  keywords?: string;
  locale: string;
  themeColor: string;
  backgroundColor: string;
  gscVerification: string;
  ogImage?: string;
  twitterHandle?: string;
  bingVerification?: string;
  pinterestVerification?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    pinterest?: string;
    twitter?: string;
  };
}

export interface LayoutData {
  brand: {
    name: string;
    tagline: string;
  };
  seo?: LayoutSeo;
  categoryTree: Category[];
  footerLinks?: FooterLinks;
  promotions?: {
    announcementBar: AnnouncementBarConfig;
  };
}

/** Lightweight shell data for header, footer, SEO, and announcement bar. */
export async function getLayoutData(): Promise<LayoutData | null> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return null;

  try {
    const res = await fetchWithTimeout(`${apiUrl}/storefront/layout`, {
      headers: {
        "Content-Type": "application/json",
        "x-tenant-domain": getTenantDomain(),
      },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
