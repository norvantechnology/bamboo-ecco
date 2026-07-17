import type { MetadataRoute } from "next";
import { BRAND_ASSETS } from "@/lib/brand";
import { resolveSiteSeo } from "@/lib/site";

/** App Router manifest — brand fields from tenant SEO (Admin). */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const seo = await resolveSiteSeo();
  return {
    name: seo.name || "Store",
    short_name: seo.name || "Store",
    description: seo.description || undefined,
    start_url: "/",
    display: "standalone",
    background_color: seo.backgroundColor || "#FAF8F3",
    theme_color: seo.themeColor || "#4B3621",
    lang: (seo.locale || "en_IN").replace("_", "-"),
    scope: "/",
    icons: [
      {
        src: BRAND_ASSETS.icon,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: BRAND_ASSETS.icon,
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: BRAND_ASSETS.icon,
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
