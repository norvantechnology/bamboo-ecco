import type { MetadataRoute } from "next";
import { getSitemapUrls } from "@/lib/api";
import { getSiteUrl, INDEXABLE_STATIC_ROUTES } from "@/lib/site";

function entry(
  path: string,
  opts?: {
    lastModified?: string | Date;
    changeFrequency?: MetadataRoute.Sitemap[0]["changeFrequency"];
    priority?: number;
    images?: string[];
  },
): MetadataRoute.Sitemap[0] {
  const base = getSiteUrl();
  const clean = path === "/" || path === "" ? "" : path.replace(/\/$/, "");
  return {
    url: clean ? `${base}${clean}` : base,
    lastModified: opts?.lastModified ? new Date(opts.lastModified) : new Date(),
    changeFrequency: opts?.changeFrequency ?? "weekly",
    priority: opts?.priority ?? 0.7,
    ...(opts?.images?.length ? { images: opts.images } : {}),
  };
}

/**
 * Dynamic sitemap — static routes + products, collections/categories, journal/guides, CMS pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = INDEXABLE_STATIC_ROUTES.map((path) =>
    entry(path, {
      changeFrequency: path === "/" ? "daily" : "weekly",
      priority: path === "/" ? 1 : path === "/shop" ? 0.9 : 0.8,
    }),
  );

  const data = await getSitemapUrls().catch(() => null);

  if (!data) {
    return staticRoutes;
  }

  const pageRoutes = data.staticPages.map((p) => {
    const path = p.slug === "artisan-stories" ? "/artisan-stories" : `/pages/${p.slug}`;
    return entry(path, {
      lastModified: p.updatedAt,
      changeFrequency: "monthly",
      priority: p.slug === "faq" ? 0.6 : 0.5,
    });
  });

  // Category product listing pages
  const collectionRoutes = data.categories.map((c) =>
    entry(`/collections/${c.slug}`, {
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );

  const productRoutes = data.products.map((p) =>
    entry(`/product/${p.slug}`, {
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
      images: p.images,
    }),
  );

  const postRoutes = data.posts.map((p) => {
    const prefix = p.type === "guide" ? "/guides" : "/journal";
    return entry(`${prefix}/${p.slug}`, {
      lastModified: p.updatedAt ?? p.publishedAt,
      changeFrequency: "monthly",
      priority: 0.55,
    });
  });

  // Brand landing pages (same categories, alternate URL surface)
  const brandRoutes = data.categories.map((c) =>
    entry(`/brand/${c.slug}`, {
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.65,
    }),
  );

  return [
    ...staticRoutes,
    ...pageRoutes,
    ...collectionRoutes,
    ...brandRoutes,
    ...productRoutes,
    ...postRoutes,
  ];
}
