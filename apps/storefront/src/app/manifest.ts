import type { MetadataRoute } from "next";
import { getSiteUrl, resolveSiteSeo } from "@/lib/site";

/** App Router manifest — brand colors from tenant SEO (admin). */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const siteUrl = getSiteUrl();
  const seo = await resolveSiteSeo();
  return {
    name: seo.name,
    short_name: seo.name,
    description: seo.description,
    start_url: "/",
    display: "standalone",
    background_color: seo.backgroundColor,
    theme_color: seo.themeColor,
    lang: seo.locale.replace("_", "-"),
    scope: "/",
    icons: [
      {
        src: `${siteUrl}/icon`,
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${siteUrl}/icon`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${siteUrl}/icon`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
