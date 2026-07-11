import type { Metadata } from "next";
import { productImageJsonLd } from "./cloudinary";
import {
  getSiteDefaultTitle,
  getSiteDescription,
  getSiteLocale,
  getSiteName,
  getSiteUrl,
  getThemeColor,
  getBackgroundColor,
} from "./site";

export { getSiteUrl, getSiteName, getSiteDescription };

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

export function buildPageMetadata({
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
}): Metadata {
  const siteName = getSiteName();
  const desc = description?.slice(0, 160) || getSiteDescription();
  const canonical = path ? absoluteUrl(path) : undefined;
  const ogImage = image ? [{ url: image, alt: imageAlt || title }] : undefined;

  return {
    title,
    description: desc,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: "website",
      siteName,
      title,
      description: desc,
      url: canonical,
      images: ogImage,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description: desc,
      images: image ? [image] : undefined,
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

export function rootMetadata(): Metadata {
  return rootMetadataFromSeo({
    name: getSiteName(),
    description: getSiteDescription(),
    defaultTitle: getSiteDefaultTitle(),
    locale: getSiteLocale(),
    themeColor: getThemeColor(),
    backgroundColor: getBackgroundColor(),
    gscVerification: "",
  });
}

/** Build root metadata from DB-backed SEO (preferred). */
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
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${seo.name} | ${seo.defaultTitle}`,
      template: `%s | ${seo.name}`,
    },
    description: seo.description,
    applicationName: seo.name,
    authors: [{ name: seo.name }],
    creator: seo.name,
    publisher: seo.name,
    formatDetection: { email: false, address: false, telephone: false },
    openGraph: {
      type: "website",
      locale: seo.locale,
      siteName: seo.name,
      title: seo.name,
      description: seo.description,
      url: siteUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.name,
      description: seo.description,
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
    other: {
      "theme-color": seo.themeColor,
    },
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

export function organizationJsonLd(brand?: { name?: string; tagline?: string; url?: string }) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand?.name || getSiteName(),
    description: brand?.tagline || getSiteDescription(),
    url: siteUrl,
    logo: `${siteUrl}/icon`,
  };
}

export function websiteJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: getSiteName(),
    description: getSiteDescription(),
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
}) {
  const prefix = post.pathPrefix ?? "journal";
  const siteName = getSiteName();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    url: absoluteUrl(`/${prefix}/${post.slug}`),
    author: { "@type": "Organization", name: siteName },
    publisher: { "@type": "Organization", name: siteName },
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
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: productImageJsonLd(product.images),
    sku: product.sku,
    brand: { "@type": "Brand", name: getSiteName() },
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
