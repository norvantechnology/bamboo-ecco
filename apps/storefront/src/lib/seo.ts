import type { Metadata } from "next";
import { productImageJsonLd } from "./cloudinary";
import { BRAND_ASSETS, brandAssetUrl } from "./brand";
import { getSiteUrl, resolveSiteSeo } from "./site";

export { getSiteUrl, resolveSiteSeo };

function defaultOgImages(alt: string) {
  return [
    {
      url: BRAND_ASSETS.icon,
      width: 512,
      height: 512,
      alt,
    },
  ];
}

/** Metadata for pages that must not be indexed */
export const noIndexMetadata: Metadata = {
  robots: { index: false, follow: false },
};

export const noIndexNoFollowMetadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export function absoluteUrl(path: string) {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Per-page metadata; site name / fallback description come from DB. */
export async function buildPageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  noIndex,
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  imageAlt?: string;
  noIndex?: boolean;
}): Promise<Metadata> {
  const seo = await resolveSiteSeo();
  const siteName = seo.name;
  const desc = (description || seo.description).slice(0, 160);
  const canonical = path ? absoluteUrl(path) : undefined;
  const ogImage = image
    ? [{ url: image, alt: imageAlt || title }]
    : defaultOgImages(imageAlt || siteName || title);

  return {
    title,
    description: desc || undefined,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: "website",
      siteName: siteName || undefined,
      title,
      description: desc || undefined,
      url: canonical,
      images: ogImage,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description: desc || undefined,
      images: image ? [image] : [BRAND_ASSETS.icon],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** Build root metadata from DB-backed SEO. */
export function rootMetadataFromSeo(seo: {
  name: string;
  description: string;
  defaultTitle: string;
  locale: string;
  themeColor: string;
  backgroundColor: string;
  gscVerification: string;
}): Metadata {
  const siteUrl = getSiteUrl();
  const defaultTitle =
    seo.name && seo.defaultTitle
      ? `${seo.name} | ${seo.defaultTitle}`
      : seo.name || seo.defaultTitle || undefined;

  return {
    metadataBase: new URL(siteUrl),
    title: seo.name
      ? { default: defaultTitle || seo.name, template: `%s | ${seo.name}` }
      : defaultTitle || undefined,
    description: seo.description || undefined,
    applicationName: seo.name || undefined,
    authors: seo.name ? [{ name: seo.name }] : undefined,
    creator: seo.name || undefined,
    publisher: seo.name || undefined,
    formatDetection: { email: false, address: false, telephone: false },
    icons: {
      icon: [{ url: BRAND_ASSETS.icon, type: "image/svg+xml" }],
      apple: [{ url: BRAND_ASSETS.icon, type: "image/svg+xml" }],
      shortcut: BRAND_ASSETS.icon,
    },
    openGraph: {
      type: "website",
      locale: seo.locale || undefined,
      siteName: seo.name || undefined,
      title: seo.name || undefined,
      description: seo.description || undefined,
      url: siteUrl,
      images: defaultOgImages(seo.name || "Bamboo Eco-Hub"),
    },
    twitter: {
      card: "summary_large_image",
      title: seo.name || undefined,
      description: seo.description || undefined,
      images: [BRAND_ASSETS.icon],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    manifest: "/manifest.webmanifest",
    ...(seo.gscVerification ? { verification: { google: seo.gscVerification } } : {}),
    ...(seo.themeColor ? { other: { "theme-color": seo.themeColor } } : {}),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function organizationJsonLd(brand: { name?: string; tagline?: string }) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name || undefined,
    description: brand.tagline || undefined,
    url: siteUrl,
    logo: brandAssetUrl("icon", siteUrl),
    image: brandAssetUrl("icon", siteUrl),
    email: "info@bambooecohub.com",
  };
}

export function websiteJsonLd(brand: { name?: string; description?: string }) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name || undefined,
    description: brand.description || undefined,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function articleJsonLd(post: {
  title: string;
  slug: string;
  description?: string;
  publishedAt?: string;
  pathPrefix?: "journal" | "guides";
  publisherName?: string;
}) {
  const prefix = post.pathPrefix ?? "journal";
  const org = post.publisherName
    ? { "@type": "Organization" as const, name: post.publisherName }
    : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    url: absoluteUrl(`/${prefix}/${post.slug}`),
    author: org,
    publisher: org,
  };
}

export function productJsonLd(product: {
  name: string;
  description?: string;
  images: { url: string; alt?: string }[];
  sku?: string;
  price?: number;
  currency?: string;
  url: string;
  inStock?: boolean;
  rating?: { avg: number; count: number };
  brandName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: productImageJsonLd(product.images),
    sku: product.sku,
    brand: product.brandName
      ? { "@type": "Brand", name: product.brandName }
      : undefined,
    offers: product.price
      ? {
          "@type": "Offer",
          price: product.price,
          priceCurrency: product.currency ?? "INR",
          availability:
            product.inStock === false
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
          url: product.url,
        }
      : undefined,
    aggregateRating:
      product.rating && product.rating.count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating.avg,
            reviewCount: product.rating.count,
          }
        : undefined,
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/** Best-effort FAQ extraction from CMS HTML (h2/h3 + following paragraph or list). */
export function extractFaqsFromHtml(html: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const re =
    /<h[23][^>]*>([\s\S]*?)<\/h[23]>\s*(?:<p[^>]*>([\s\S]*?)<\/p>|<ul[^>]*>([\s\S]*?)<\/ul>)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const question = match[1].replace(/<[^>]+>/g, "").trim();
    const answer = (match[2] || match[3] || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (question && answer && question.length < 200) {
      faqs.push({ question, answer });
    }
  }
  return faqs;
}
