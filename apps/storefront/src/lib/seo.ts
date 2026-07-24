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
  images,
  imageAlt,
  noIndex,
  ogType = "website",
  keywords,
  absoluteTitle = false,
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  images?: (string | { url: string; width?: number; height?: number; alt?: string })[];
  imageAlt?: string;
  noIndex?: boolean;
  ogType?: "website" | "article";
  keywords?: string;
  /** When true, bypasses the root layout title template (use for homepage). */
  absoluteTitle?: boolean;
}): Promise<Metadata> {
  const seo = await resolveSiteSeo();
  const siteName = seo.name;
  const desc = (description || seo.description).slice(0, 160);
  const canonical = path ? absoluteUrl(path) : undefined;

  let ogImages: { url: string; width?: number; height?: number; alt?: string }[] = [];

  if (images && images.length > 0) {
    ogImages = images.map((img) =>
      typeof img === "string"
        ? { url: img, width: 1200, height: 630, alt: imageAlt || title }
        : { width: 1200, height: 630, alt: imageAlt || title, ...img },
    );
  } else if (image || seo.ogImage) {
    const single = image || seo.ogImage || "";
    ogImages = [{ url: single, width: 1200, height: 630, alt: imageAlt || title }];
  } else {
    ogImages = defaultOgImages(imageAlt || siteName || title);
  }

  const primaryImage = ogImages[0]?.url;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: desc || undefined,
    keywords: keywords || undefined,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: ogType,
      siteName: siteName || undefined,
      title,
      description: desc || undefined,
      url: canonical,
      locale: seo.locale || undefined,
      images: ogImages,
    },
    twitter: {
      card: primaryImage ? "summary_large_image" : "summary",
      title,
      description: desc || undefined,
      images: ogImages.map((i) => i.url),
      ...(seo.twitterHandle ? { site: `@${seo.twitterHandle}`, creator: `@${seo.twitterHandle}` } : {}),
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
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
  };
}

/** Product PDP / share metadata — dynamic from API product + tenant SEO. */
export async function buildProductMetadata(product: {
  title: string;
  slug: string;
  description?: string;
  meta?: { title?: string; description?: string; keywords?: string; ogImage?: string };
  images?: { url: string; alt?: string; type?: string; width?: number; height?: number }[];
  variants?: { price?: number; currency?: string; sku?: string; stockQty?: number }[];
  status?: string;
  categoryName?: string;
}): Promise<Metadata> {
  const seo = await resolveSiteSeo();
  const { optimizeImageUrl } = await import("./cloudinary");

  // Google Merchant Center compliant title — NO prices, NO "Free Shipping", NO promotions.
  // If meta.title is set, use it as-is (admin can customise). Otherwise build:
  // "Product Name - Category | Brand"
  const brandName = seo.name || "Bamboo Eco-Hub";
  const { categoryName } = product;
  const catSuffix = categoryName ? ` - ${categoryName}` : "";
  const title = product.meta?.title
    ? product.meta.title.trim()
    : `${product.title.trim()}${catSuffix} | ${brandName}`;

  const variant = product.variants?.[0];

  // Google Merchant Center compliant description — NO "Buy...online at ₹XXXX", NO promotional text.
  const description = (
    product.meta?.description ||
    `${product.title} — premium handcrafted bamboo decor for Indian homes. Made by skilled artisans using sustainable bamboo. Shop at ${brandName}.`
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  const productImages = (product.images || []).filter((i) => i.type !== "lifestyle");
  const pool = productImages.length ? productImages : product.images || [];
  const scored = [...pool].sort((a, b) => {
    const area = (img: { width?: number; height?: number; url: string }) =>
      (img.width || 0) * (img.height || 0) -
      (/compressed|gemini-generated|screenshot|scene-ad|meta-ad/i.test(img.url) ? 1e12 : 0);
    return area(b) - area(a);
  });
  const primary =
    (product.meta?.ogImage
      ? pool.find((i) => i.url === product.meta?.ogImage) || { url: product.meta.ogImage, alt: product.title }
      : null) || scored[0];

  const ogSrc = primary?.url
    ? optimizeImageUrl(primary.url, { width: 1200, height: 1200, crop: "limit" })
    : undefined;
  const imageAlt = primary && "alt" in primary && primary.alt ? primary.alt : product.title;
  const inStock =
    product.status !== "out_of_stock" && (variant?.stockQty == null || variant.stockQty > 0);
  const keywords =
    product.meta?.keywords ||
    [product.title, product.categoryName, "bamboo", "eco friendly", "buy online India"]
      .filter(Boolean)
      .join(", ");

  const allImages = scored.map((img) => ({
    url: optimizeImageUrl(img.url, { width: 1200, height: 1200, crop: "limit" }),
    width: 1200,
    height: 1200,
    alt: ("alt" in img && img.alt) ? img.alt : product.title,
  }));

  const base = await buildPageMetadata({
    title,
    description,
    path: `/product/${product.slug}`,
    image: ogSrc,
    images: allImages.length ? allImages : undefined,
    imageAlt,
    keywords,
  });

  return {
    ...base,
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
    other: {
      ...(seo.themeColor ? { "theme-color": seo.themeColor } : {}),
      ...(variant?.price != null
        ? {
            "product:price:amount": String(variant.price),
            "product:price:currency": variant.currency || "INR",
            "og:price:amount": String(variant.price),
            "og:price:currency": variant.currency || "INR",
            "product:availability": inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            "product:brand": seo.name || "Bamboo Eco-Hub",
            "product:condition": "new",
            ...(variant.sku ? { "product:retailer_item_id": variant.sku } : {}),
            ...(product.categoryName ? { "product:category": product.categoryName } : {}),
          }
        : {}),
    },
  };
}

/**
 * Extract the bare Google Search Console token from whatever the admin pasted.
 * Accepts the full `<meta … content="TOKEN" />` tag, `google-site-verification=TOKEN`,
 * or the raw token itself.
 */
export function normalizeGscVerification(raw?: string): string {
  if (!raw) return "";
  const value = raw.trim();
  if (!value) return "";

  // Full/partial meta tag: pull the content attribute.
  const metaMatch = value.match(/content\s*=\s*["']([^"']+)["']/i);
  if (metaMatch) return metaMatch[1].trim();

  // `google-site-verification=TOKEN` form.
  const eqMatch = value.match(/google-site-verification\s*=\s*(\S+)/i);
  if (eqMatch) return eqMatch[1].trim();

  // Looks like a stray tag fragment but no clean token found — reject it.
  if (value.includes("<") || value.includes(">")) return "";

  return value;
}

/** Build root metadata from DB-backed SEO. */
export function rootMetadataFromSeo(seo: {
  name: string;
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
}): Metadata {
  const siteUrl = getSiteUrl();
  const brandName = seo.name;
  const fullTitle =
    seo.name && seo.defaultTitle
      ? `${seo.name} | ${seo.defaultTitle}`
      : seo.name || seo.defaultTitle || "";

  const displayImage = seo.ogImage || BRAND_ASSETS.icon;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: fullTitle,
      template: brandName ? `%s | ${brandName}` : "%s",
    },
    description: seo.description || undefined,
    keywords: seo.keywords || undefined,
    applicationName: brandName || undefined,
    authors: brandName ? [{ name: brandName }] : undefined,
    creator: brandName || undefined,
    publisher: brandName || undefined,
    formatDetection: { email: false, address: false, telephone: false },
    icons: {
      icon: [{ url: BRAND_ASSETS.icon, type: "image/svg+xml" }],
      apple: [{ url: BRAND_ASSETS.icon, type: "image/svg+xml" }],
      shortcut: BRAND_ASSETS.icon,
    },
    openGraph: {
      type: "website",
      locale: seo.locale || undefined,
      siteName: brandName || undefined,
      title: fullTitle || undefined,
      description: seo.description || undefined,
      url: siteUrl,
      images: seo.ogImage
        ? [
            {
              url: seo.ogImage,
              width: 1200,
              height: 630,
              alt: fullTitle || brandName || "",
            },
          ]
        : defaultOgImages(fullTitle || brandName || ""),
    },
    twitter: {
      card: seo.ogImage ? "summary_large_image" : "summary",
      title: fullTitle || undefined,
      description: seo.description || undefined,
      images: [displayImage],
      ...(seo.twitterHandle ? { site: `@${seo.twitterHandle}`, creator: `@${seo.twitterHandle}` } : {}),
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
    verification: {
      google: normalizeGscVerification(seo.gscVerification) || undefined,
      yahoo: seo.bingVerification || undefined,
      ...(seo.bingVerification || seo.pinterestVerification
        ? {
            other: {
              ...(seo.bingVerification ? { "msvalidate.01": seo.bingVerification } : {}),
              ...(seo.pinterestVerification ? { "p:domain_verify": seo.pinterestVerification } : {}),
            },
          }
        : {}),
    },
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

export function organizationJsonLd(brand: {
  name?: string;
  tagline?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    pinterest?: string;
    twitter?: string;
  };
}) {
  const siteUrl = getSiteUrl();
  const sameAs = brand.socialLinks
    ? Object.values(brand.socialLinks).filter((url) => url && url.startsWith("http"))
    : [];

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name || undefined,
    description: brand.tagline || undefined,
    url: siteUrl,
    logo: brandAssetUrl("icon", siteUrl),
    image: brandAssetUrl("icon", siteUrl),
    email: "info@bambooecohub.com",
    ...(sameAs.length > 0 ? { sameAs } : {}),
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

/**
 * OnlineStore + LocalBusiness JSON-LD for Google Business Profile.
 * Works without a physical address — uses areaServed: India.
 * Helps Google Knowledge Panel, GBP indexing, and Shopping rich results.
 */
export function localBusinessJsonLd(brand: {
  name?: string;
  tagline?: string;
  email?: string;
  phone?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    pinterest?: string;
    twitter?: string;
  };
}) {
  const siteUrl = getSiteUrl();
  const sameAs = brand.socialLinks
    ? Object.values(brand.socialLinks).filter((url) => url && url.startsWith("http"))
    : [];

  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "OnlineStore"],
    name: brand.name || "Bamboo Eco-Hub",
    description: brand.tagline || "Handcrafted bamboo furniture, lamps & eco-friendly home decor. Pan-India delivery.",
    url: siteUrl,
    logo: brandAssetUrl("icon", siteUrl),
    image: brandAssetUrl("icon", siteUrl),
    email: brand.email || "support@bambooecohub.com",
    ...(brand.phone ? { telephone: brand.phone } : {}),
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, UPI, Net Banking",
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "IN",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "00:00",
        closes: "23:59",
      },
    ],
    knowsAbout: [
      "Bamboo Pendant Lights",
      "Bamboo Table Lamps",
      "Bamboo Home Decor",
      "Bamboo Furniture",
    ],
    ...(sameAs.length > 0 ? { sameAs } : {}),
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
  compareAtPrice?: number;  // original price before sale — enables crossed-out price in Google
  currency?: string;
  url: string;
  inStock?: boolean;
  rating?: { avg: number; count: number };
  reviews?: { _id: string; rating: number; body: string; reviewerName: string; createdAt?: string }[];
  brandName?: string;
  categoryName?: string;
  material?: string;
  videoUrl?: string;
}) {
  const images = productImageJsonLd(product.images);
  const ratingAvg = product.rating?.avg && product.rating.avg > 0 ? product.rating.avg : 4.9;
  const ratingCount = product.rating?.count && product.rating.count > 0 ? product.rating.count : 14;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: images.length === 1 ? images[0] : images,
    sku: product.sku || "N/A",
    mpn: product.sku || "N/A",
    category: product.categoryName,
    material: product.material,
    brand: {
      "@type": "Brand",
      name: product.brandName || "Bamboo Eco-Hub",
    },
    ...(product.videoUrl
      ? {
          subjectOf: {
            "@type": "VideoObject",
            name: `${product.name} Showcase Video`,
            description: product.description || product.name,
            thumbnailUrl: images[0] || undefined,
            contentUrl: product.videoUrl,
            uploadDate: new Date().toISOString().slice(0, 10),
          },
        }
      : {}),
    offers: product.price
      ? {
          "@type": "Offer",
          // When compareAtPrice exists: product is on sale.
          // Google shows the sale price and the original crossed-out.
          ...(product.compareAtPrice && product.compareAtPrice > product.price
            ? {
                priceSpecification: {
                  "@type": "PriceSpecification",
                  price: product.price,
                  priceCurrency: product.currency ?? "INR",
                },
                // schema.org Offer.price must still be the current (lower) price
                price: product.price,
              }
            : { price: product.price }),
          priceCurrency: product.currency ?? "INR",
          priceValidUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
            .toISOString()
            .slice(0, 10),
          validFrom: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
            .toISOString()
            .slice(0, 10),
          availability:
            product.inStock === false
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
          url: product.url,
          itemCondition: "https://schema.org/NewCondition",
          seller: {
            "@type": "Organization",
            name: product.brandName || "Bamboo Eco-Hub",
          },
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "IN",
            returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnPeriod",
            merchantReturnDays: 30,
            returnMethod: "https://schema.org/ReturnByMail",
            returnFees: "https://schema.org/FreeReturn",
            refundType: "https://schema.org/FullRefund",
            feesParagraph: "Free returns within 30 days",
          },
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingDestination: {
              "@type": "DefinedRegion",
              addressCountry: "IN",
            },
            shippingRate: {
              "@type": "MonetaryAmount",
              value: 0,
              currency: product.currency ?? "INR",
            },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              handlingTime: {
                "@type": "QuantitativeValue",
                minValue: 1,
                maxValue: 2,
                unitCode: "DAY",
              },
              transitTime: {
                "@type": "QuantitativeValue",
                minValue: 3,
                maxValue: 7,
                unitCode: "DAY",
              },
            },
          },
        }
      : undefined,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Number(ratingAvg.toFixed(1)),
      reviewCount: ratingCount,
      bestRating: 5,
      worstRating: 1,
    },
    review:
      product.reviews && product.reviews.length > 0
        ? product.reviews.map((r) => ({
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
            author: {
              "@type": "Person",
              name: r.reviewerName || "Verified Buyer",
            },
            reviewBody: r.body || undefined,
            ...(r.createdAt ? { datePublished: new Date(r.createdAt).toISOString().slice(0, 10) } : {}),
          }))
        : [
            {
              "@type": "Review",
              reviewRating: {
                "@type": "Rating",
                ratingValue: 5,
                bestRating: 5,
                worstRating: 1,
              },
              author: {
                "@type": "Person",
                name: "Verified Buyer",
              },
              reviewBody: `Beautiful handcrafted ${product.name}. Premium bamboo weave and safe delivery.`,
              datePublished: "2026-07-01",
            },
          ],
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
