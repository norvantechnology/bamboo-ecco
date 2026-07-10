import type { MetadataRoute } from "next";
import { getSitemapUrls } from "@/lib/api";
import { getSiteUrl, INDEXABLE_STATIC_ROUTES } from "@/lib/site";

function entry(
  path: string,
  opts?: { lastModified?: string | Date; changeFrequency?: MetadataRoute.Sitemap[0]["changeFrequency"]; priority?: number },
): MetadataRoute.Sitemap[0] {
  const base = getSiteUrl();
  return {
    url: path === "/" || path === "" ? base : `${base}${path}`,
    lastModified: opts?.lastModified ? new Date(opts.lastModified) : new Date(),
    changeFrequency: opts?.changeFrequency ?? "weekly",
    priority: opts?.priority ?? 0.7,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = INDEXABLE_STATIC_ROUTES.map((path) =>
    entry(path, {
      changeFrequency: path === "/" ? "daily" : "weekly",
      priority: path === "/" ? 1 : 0.8,
    }),
  );

  const data = await getSitemapUrls().catch(() => null);

  if (!data) {
    return staticRoutes;
  }

  const pageRoutes = data.staticPages.map((p) =>
    entry(`/pages/${p.slug}`, { lastModified: p.updatedAt, changeFrequency: "monthly", priority: 0.5 }),
  );

  const collectionRoutes = data.categories.map((c) =>
    entry(`/collections/${c.slug}`, { lastModified: c.updatedAt, priority: 0.75 }),
  );

  const productRoutes = data.products.map((p) =>
    entry(`/product/${p.slug}`, { lastModified: p.updatedAt, priority: 0.6 }),
  );

  const postRoutes = data.posts.map((p) => {
    const prefix = p.type === "guide" ? "/guides" : "/journal";
    return entry(`${prefix}/${p.slug}`, {
      lastModified: p.updatedAt ?? p.publishedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  });

  return [
    ...staticRoutes,
    ...pageRoutes,
    ...collectionRoutes,
    ...productRoutes,
    ...postRoutes,
  ];
}
