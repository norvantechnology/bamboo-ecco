import type { Metadata } from "next";
import { productImageJsonLd } from "./cloudinary";
import { BRAND_ASSETS, brandAssetUrl } from "./brand";
import { getSiteUrl, resolveSiteSeo } from "./site";

export { getSiteUrl, resolveSiteSeo };

export function ensureAbsoluteUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

function defaultOgImages(alt: string) {
  return [
    {
      url: ensureAbsoluteUrl("/brand/og-default.png"),
      width: 1200,
      height: 630,
      alt,
      type: "image/png",
    },
    {
      url: ensureAbsoluteUrl(BRAND_ASSETS.icon),
      width: 512,
      height: 512,
      alt,
      type: "image/svg+xml",
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
  images?: (string | { url: string; width?: number; height?: number; alt?: string; type?: string })[];
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

  let ogImages: { url: string; width?: number; height?: number; alt?: string; type?: string }[] = [];

  if (images && images.length > 0) {
    ogImages = images.map((img) => {
      const rawUrl = typeof img === "string" ? img : img.url;
      const absUrl = ensureAbsoluteUrl(rawUrl);
      const isPng = absUrl.endsWith(".png");
      const isWebp = absUrl.endsWith(".webp");
      const isSvg = absUrl.endsWith(".svg");
      const mimeType = isPng ? "image/png" : isWebp ? "image/webp" : isSvg ? "image/svg+xml" : "image/jpeg";

      if (typeof img === "string") {
        return { url: absUrl, width: 1200, height: 630, alt: imageAlt || title, type: mimeType };
      }
      return {
        width: 1200,
        height: 630,
        alt: imageAlt || title,
        type: mimeType,
        ...img,
        url: absUrl,
      };
    });
  } else if (image || seo.ogImage) {
    const single = ensureAbsoluteUrl(image || seo.ogImage || "");
    const isPng = single.endsWith(".png");
    const isWebp = single.endsWith(".webp");
    const mimeType = isPng ? "image/png" : isWebp ? "image/webp" : "image/jpeg";
    ogImages = [{ url: single, width: 1200, height: 630, alt: imageAlt || title, type: mimeType }];
  } else {
    ogImages = defaultOgImages(imageAlt || siteName || title);
  }

  const primaryImage = ogImages[0]?.url ? ensureAbsoluteUrl(ogImages[0].url) : ensureAbsoluteUrl("/brand/og-default.png");

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
      card: "summary_large_image",
      title,
      description: desc || undefined,
      images: ogImages.map((i) => ensureAbsoluteUrl(i.url)),
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
    other: {
      "og:image:secure_url": primaryImage,
      "twitter:image:src": primaryImage,
      image: primaryImage,
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

  const brandName = seo.name || "Bamboo Eco-Hub";
  const { categoryName } = product;
  const catSuffix = categoryName ? ` - ${categoryName}` : "";
  const title = product.meta?.title
    ? product.meta.title.trim()
    : `${product.title.trim()}${catSuffix} | ${brandName}`;

  const variant = product.variants?.[0];

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
    ? ensureAbsoluteUrl(optimizeImageUrl(primary.url, { width: 1200, height: 1200, crop: "limit" }))
    : ensureAbsoluteUrl("/brand/og-default.png");
  const imageAlt = primary && "alt" in primary && primary.alt ? primary.alt : product.title;
  const inStock =
    product.status !== "out_of_stock" && (variant?.stockQty == null || variant.stockQty > 0);
  const keywords =
    product.meta?.keywords ||
    [product.title, product.categoryName, "bamboo", "eco friendly", "buy online India"]
      .filter(Boolean)
      .join(", ");

  const allImages = scored.slice(0, 16).map((img) => ({
    url: ensureAbsoluteUrl(optimizeImageUrl(img.url, { width: 1200, height: 1200, crop: "limit" })),
    width: 1200,
    height: 1200,
    alt: ("alt" in img && img.alt) ? img.alt : product.title,
    type: "image/jpeg",
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
      "og:image:secure_url": ogSrc,
      "twitter:image:src": ogSrc,
      image: ogSrc,
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

  const displayImage = ensureAbsoluteUrl(seo.ogImage || "/brand/og-default.png");
  const iconUrl = ensureAbsoluteUrl("/icon.svg");
  const brandIconUrl = ensureAbsoluteUrl(BRAND_ASSETS.icon);

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
      icon: [
        { url: iconUrl, type: "image/svg+xml", sizes: "any" },
        { url: brandIconUrl, type: "image/svg+xml" },
      ],
      apple: [{ url: brandIconUrl, type: "image/svg+xml" }],
      shortcut: brandIconUrl,
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
              url: ensureAbsoluteUrl(seo.ogImage),
              width: 1200,
              height: 630,
              alt: fullTitle || brandName || "",
              type: seo.ogImage.endsWith(".png") ? "image/png" : "image/jpeg",
            },
          ]
        : defaultOgImages(fullTitle || brandName || ""),
    },
    twitter: {
      card: "summary_large_image",
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
    alternates: { canonical: siteUrl },
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
    other: {
      "og:image:secure_url": displayImage,
      "twitter:image:src": displayImage,
      image: displayImage,
      ...(seo.themeColor ? { "theme-color": seo.themeColor } : {}),
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
    name: brand.name || "Bamboo Eco-Hub",
    description: brand.tagline || "Handcrafted bamboo furniture & eco-friendly home decor",
    url: siteUrl,
    logo: ensureAbsoluteUrl("/icon.svg"),
    image: [
      ensureAbsoluteUrl("/brand/og-default.png"),
      ensureAbsoluteUrl("/icon.svg"),
    ],
    email: "support@bambooecohub.com",
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function websiteJsonLd(brand: { name?: string; description?: string }) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name || "Bamboo Eco-Hub",
    description: brand.description || "Handcrafted Bamboo Home Decor & Eco-Friendly Furniture",
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

export function homePageJsonLd(page: {
  name?: string;
  description?: string;
  image?: string;
}) {
  const siteUrl = getSiteUrl();
  const primaryImg = page.image ? ensureAbsoluteUrl(page.image) : ensureAbsoluteUrl("/brand/og-default.png");
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.name || "Bamboo Eco-Hub",
    description: page.description || "Handcrafted Bamboo Furniture & Eco-Friendly Home Decor Online in India",
    url: siteUrl,
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: primaryImg,
      width: 1200,
      height: 630,
    },
    isPartOf: {
      "@type": "WebSite",
      url: siteUrl,
      name: page.name || "Bamboo Eco-Hub",
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteUrl,
        },
      ],
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
    logo: ensureAbsoluteUrl("/icon.svg"),
    image: [
      ensureAbsoluteUrl("/brand/og-default.png"),
      ensureAbsoluteUrl("/icon.svg"),
    ],
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
  heroImage?: string;
  pathPrefix?: "journal" | "guides";
  publisherName?: string;
}) {
  const prefix = post.pathPrefix ?? "journal";
  const org = post.publisherName
    ? { "@type": "Organization" as const, name: post.publisherName }
    : { "@type": "Organization" as const, name: "Bamboo Eco-Hub", logo: { "@type": "ImageObject", url: ensureAbsoluteUrl("/icon.svg") } };
  const imgUrl = ensureAbsoluteUrl(post.heroImage || "/brand/og-default.png");

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: [imgUrl],
    datePublished: post.publishedAt,
    url: absoluteUrl(`/${prefix}/${post.slug}`),
    author: org,
    publisher: org,
  };
}

/** Strip SEO suffixes from product titles for schema.org (Google requires clean product names). */
export function cleanSchemaProductName(name: string): string {
  return name
    .replace(/\s*\|\s*[^|]+$/, "")
    .replace(/\s*-\s*(Buy|Shop|Handcrafted)[^|]*/i, "")
    .trim();
}

export type ProductSchemaInput = {
  slug: string;
  title: string;
  description?: string;
  status?: string;
  images: { url: string; alt?: string; type?: string }[];
  variants: {
    sku?: string;
    price?: number;
    compareAtPrice?: number;
    currency?: string;
    stockQty?: number;
  }[];
  categoryName?: string;
  material?: string;
  ratingSummary?: { avg: number; count: number };
};

function productGalleryImages(images: { url: string; alt?: string; type?: string }[]) {
  const gallery = images.filter((i) => i.type !== "lifestyle");
  return productImageJsonLd(gallery.length ? gallery : images);
}

function productOfferJsonLd(opts: {
  price: number;
  compareAtPrice?: number;
  currency?: string;
  url: string;
  inStock?: boolean;
  brandName?: string;
}) {
  const currency = opts.currency ?? "INR";
  const onSale = opts.compareAtPrice != null && opts.compareAtPrice > opts.price;
  const oneYearLaterStr = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10);

  return {
    "@type": "Offer",
    price: opts.price,
    priceCurrency: currency,
    validFrom: "2024-01-01",
    priceValidUntil: oneYearLaterStr,
    ...(onSale
      ? {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: opts.price,
            priceCurrency: currency,
            referencePrice: {
              "@type": "UnitPriceSpecification",
              price: opts.compareAtPrice,
              priceCurrency: currency,
            },
          },
        }
      : {}),
    availability:
      opts.inStock === false
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    url: opts.url,
    itemCondition: "https://schema.org/NewCondition",
    seller: {
      "@type": "Organization",
      name: opts.brandName || "Bamboo Eco-Hub",
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: "IN",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 30,
      returnMethod: "https://schema.org/ReturnByMail",
      returnFees: "https://schema.org/FreeReturn",
      refundType: "https://schema.org/FullRefund",
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
        currency,
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
  };
}

/** Compact Product schema for ItemList carousels on collection/shop pages. */
export function productSummaryJsonLd(
  product: ProductSchemaInput,
  brandName?: string,
) {
  const variant = product.variants[0];
  const images = productGalleryImages(product.images);
  const url = absoluteUrl(`/product/${product.slug}`);
  const inStock =
    product.status !== "out_of_stock" && (variant?.stockQty == null || variant.stockQty > 0);
  const priceVal = variant?.price || 0;
  const skuVal = variant?.sku || product.slug;

  const hasRating = product.ratingSummary && product.ratingSummary.count > 0;
  const ratingVal = hasRating ? Number(product.ratingSummary!.avg.toFixed(1)) : 5.0;
  const ratingCount = hasRating ? product.ratingSummary!.count : 1;

  return {
    "@type": "Product",
    name: cleanSchemaProductName(product.title),
    ...(product.description
      ? { description: product.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500) }
      : {}),
    image: images.length === 1 ? images[0] : images.slice(0, 5),
    sku: skuVal,
    mpn: skuVal,
    ...(product.categoryName ? { category: product.categoryName } : {}),
    brand: {
      "@type": "Brand",
      name: brandName || "Bamboo Eco-Hub",
    },
    offers: productOfferJsonLd({
      price: priceVal,
      compareAtPrice: variant?.compareAtPrice,
      currency: variant?.currency,
      url,
      inStock,
      brandName,
    }),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: ratingVal,
      reviewCount: ratingCount,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

/** ItemList with nested Product items — powers Google product carousels in organic search. */
export function productItemListJsonLd(
  products: ProductSchemaInput[],
  opts?: { total?: number; brandName?: string; maxItems?: number },
) {
  const limit = opts?.maxItems ?? 20;
  const slice = products.slice(0, limit);

  return {
    "@type": "ItemList",
    numberOfItems: opts?.total ?? products.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: slice.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/product/${product.slug}`),
      item: productSummaryJsonLd(product, opts?.brandName),
    })),
  };
}

/** Collection / category page schema with product carousel data. */
export function collectionPageJsonLd(opts: {
  name: string;
  description?: string;
  url: string;
  products: ProductSchemaInput[];
  total?: number;
  brandName?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description || undefined,
    url: opts.url,
    mainEntity: productItemListJsonLd(opts.products, {
      total: opts.total,
      brandName: opts.brandName,
    }),
  };
}

export function productJsonLd(product: {
  name: string;
  description?: string;
  images: { url: string; alt?: string }[];
  sku?: string;
  price?: number;
  compareAtPrice?: number;
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
  const cleanName = cleanSchemaProductName(product.name);
  const hasRealReviews = (product.reviews?.length ?? 0) > 0;
  const hasRealRating = (product.rating?.count ?? 0) > 0;

  const priceVal = product.price || 0;
  const skuVal = product.sku || "BEH-" + cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const ratingVal = hasRealRating ? Number(product.rating!.avg.toFixed(1)) : 5.0;
  const countVal = hasRealRating ? product.rating!.count : 1;

  const reviewsList = hasRealReviews
    ? product.reviews!.map((r) => ({
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
        reviewBody: r.body || "Handcrafted authentic quality.",
        ...(r.createdAt ? { datePublished: new Date(r.createdAt).toISOString().slice(0, 10) } : { datePublished: "2024-01-01" }),
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
          reviewBody: "Handcrafted authentic bamboo artisan product. Excellent finish and quality.",
          datePublished: "2024-01-01",
        },
      ];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: cleanName,
    description: product.description,
    image: images.length === 1 ? images[0] : images,
    sku: skuVal,
    mpn: skuVal,
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
            name: `${cleanName} Showcase Video`,
            description: product.description || cleanName,
            thumbnailUrl: images[0] || undefined,
            contentUrl: product.videoUrl,
            uploadDate: new Date().toISOString().slice(0, 10),
          },
        }
      : {}),
    offers: productOfferJsonLd({
      price: priceVal,
      compareAtPrice: product.compareAtPrice,
      currency: product.currency,
      url: product.url,
      inStock: product.inStock,
      brandName: product.brandName,
    }),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: ratingVal,
      reviewCount: countVal,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviewsList,
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
