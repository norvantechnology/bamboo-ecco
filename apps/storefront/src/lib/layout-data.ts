import type { AnnouncementBarConfig, Category, FooterLinks } from "./api";
import { getApiUrl } from "./api-config";
import { fetchWithTimeout } from "./fetch-with-timeout";

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
export async function getLayoutData(): Promise<LayoutData | null> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return null;

  try {
    const res = await fetchWithTimeout(`${apiUrl}/storefront/layout`, {
      headers: {
        "Content-Type": "application/json",
        "x-tenant-domain": "localhost",
      },
      ...(IS_DEV ? { cache: "no-store" as const } : { next: { revalidate: 120 } }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
