import type { AnnouncementBarConfig, Category, FooterLinks } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const IS_DEV = process.env.NODE_ENV === "development";

export interface LayoutData {
  brand: {
    name: string;
    tagline: string;
  };
  categoryTree: Category[];
  footerLinks?: FooterLinks;
  promotions?: {
    announcementBar: AnnouncementBarConfig;
  };
}

/** Lightweight shell data for header, footer, and announcement bar — not the full homepage payload. */
export function getLayoutData(): Promise<LayoutData> {
  return fetch(`${API_URL}/storefront/layout`, {
    headers: {
      "Content-Type": "application/json",
      "x-tenant-domain": "localhost",
    },
    ...(IS_DEV ? { cache: "no-store" as const } : { next: { revalidate: 120 } }),
  }).then((res) => {
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  });
}
