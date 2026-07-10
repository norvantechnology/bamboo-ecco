import type { MetadataRoute } from "next";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  const siteUrl = getSiteUrl();
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F3",
    theme_color: "#4B3621",
    lang: "en",
    scope: "/",
    icons: [
      {
        src: `${siteUrl}/icon`,
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
