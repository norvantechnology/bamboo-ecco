import { withHomepageSections } from "./homepage-sections";
import { getApiUrl, getRuntimeApiUrl, getTenantDomain } from "./api-config";
import { fetchWithTimeout } from "./fetch-with-timeout";

const IS_DEV = process.env.NODE_ENV === "development";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    throw new Error("API URL not configured");
  }

  const res = await fetchWithTimeout(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-tenant-domain": getTenantDomain(),
      ...options?.headers,
    },
    // In dev, always fetch fresh data so admin edits show on normal refresh.
    // In production, cache for 60s for performance.
    ...(IS_DEV ? { cache: "no-store" as const } : { next: { revalidate: 60 } }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export interface BrandTheme {
  background: string;
  primary: string;
  secondary: string;
  text: string;
  gold: string;
}

export interface HeroContent {
  headline: string;
  subheading: string;
  imageUrl?: string;
  videoUrl?: string;
  primaryCta: string;
  secondaryCta: string;
}

export interface BrandPillar {
  icon: string;
  title: string;
  description: string;
}

export interface Category {
  _id: string;
  slug: string;
  name: string;
  imageUrl?: string;
  parentId?: string | null;
  meta?: { title?: string; description?: string };
  children?: Category[];
  parent?: { _id: string; slug: string; name: string } | null;
}

export interface ProductImage {
  url: string;
  alt: string;
  sortOrder?: number;
  type?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface ProductSpecs {
  dimensions?: string;
  weight?: string;
  material?: string;
  careInstructions?: string;
  shippingInfo?: string;
  warranty?: string;
}

export interface ProductCategoryRef {
  _id: string;
  slug: string;
  name: string;
  parentId?: { _id: string; slug: string; name: string } | string | null;
}

export interface Product {
  _id: string;
  slug: string;
  title: string;
  description: string;
  status?: string;
  categoryId?: string | ProductCategoryRef;
  meta?: { title?: string; description?: string };
  images: ProductImage[];
  variants: {
    sku: string;
    price: number;
    compareAtPrice?: number;
    currency: string;
    stockQty: number;
    attributes?: Record<string, string>;
  }[];
  specs?: ProductSpecs;
  videoUrl?: string;
  model3d?: { glbUrl?: string; usdzUrl?: string; posterUrl?: string };
  ratingSummary: { avg: number; count: number };
}

export function getProductCategory(product: Product): ProductCategoryRef | null {
  if (product.categoryId && typeof product.categoryId === "object" && "slug" in product.categoryId) {
    return product.categoryId;
  }
  return null;
}

/** True when customers can add the product to cart / checkout. */
export function isProductInStock(product: Product, stockQty?: number) {
  if (product.status === "out_of_stock") return false;
  const qty = stockQty ?? product.variants[0]?.stockQty ?? 0;
  return qty > 0;
}

export interface Review {
  _id: string;
  reviewerName: string;
  rating: number;
  body: string;
  photos: string[];
  productId?: { title: string; slug: string } | string;
}

export interface CustomerPhoto {
  _id: string;
  imageUrl: string;
  caption: string;
  customerName: string;
}

export interface GalleryItem {
  _id: string;
  imageUrl: string;
  caption: string;
  instagramUrl?: string;
}

export interface HomepageSection {
  enabled: boolean;
  label: string;
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
  limit?: number;
}

export interface HomepageSections {
  collections: HomepageSection;
  lifestyle: HomepageSection;
  newArrivals: HomepageSection;
  bestSellers: HomepageSection;
  whyChooseUs: HomepageSection;
  customerHomes: HomepageSection;
  reviews: HomepageSection;
  journal: HomepageSection;
  gallery: HomepageSection;
}

export interface BlogPost {
  _id: string;
  slug: string;
  title: string;
  type?: "blog" | "guide";
  meta?: { title?: string; description?: string };
  publishedAt?: string;
}

export interface HomepageData {
  brand: {
    name: string;
    tagline: string;
    theme: BrandTheme;
    hero: HeroContent;
    brandPillars: BrandPillar[];
    whyChooseUs: BrandPillar[];
  };
  promotions?: {
    welcomePopup: WelcomePopupConfig;
    announcementBar: AnnouncementBarConfig;
  };
  sections?: HomepageSections;
  collections: Category[];
  categoryTree?: Category[];
  bestSellers: Product[];
  lifestyleProducts: Product[];
  newArrivals: Product[];
  reviews: Review[];
  customerHomes: CustomerPhoto[];
  gallery: GalleryItem[];
  blogPosts: BlogPost[];
  footerLinks?: FooterLinks;
}

export interface FooterLink {
  slug: string;
  title: string;
  href: string;
}

export interface FooterLinks {
  explore: FooterLink[];
  help: FooterLink[];
  legal: FooterLink[];
}

export interface WelcomePopupConfig {
  enabled: boolean;
  mode: "html" | "image";
  html: string;
  imageUrl: string;
  imageLink: string;
}

export interface AnnouncementBarConfig {
  enabled: boolean;
  html: string;
  backgroundColor: string;
  textColor: string;
  animation: "marquee" | "pulse" | "slide" | "none";
  dismissible: boolean;
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function getHomepage() {
  return fetchApi<HomepageData>("/storefront/homepage").then(withHomepageSections);
}

export function getNavigation() {
  return fetchApi<Category[]>("/storefront/navigation");
}

export function getCategoryTree() {
  return fetchApi<Category[]>("/categories/tree");
}

export function getCategories() {
  return fetchApi<Category[]>("/categories");
}

export function getCategory(slug: string) {
  return fetchApi<Category>(`/categories/${slug}`);
}

export function getFeaturedProducts() {
  return fetchApi<Product[]>("/products/featured");
}

export function getNewArrivals() {
  return fetchApi<Product[]>("/products/new-arrivals");
}

export function getProductsByCategorySlug(
  slug: string,
  page = 1,
  sort: "newest" | "price-asc" | "price-desc" | "rating" = "newest",
) {
  return fetchApi<PaginatedProducts>(
    `/products/category-slug/${slug}?page=${page}&sort=${sort}`,
  );
}

export function getProduct(slug: string) {
  return fetchApi<Product>(`/products/${slug}`);
}

export function getShopProducts(
  page = 1,
  sort: "newest" | "price-asc" | "price-desc" | "rating" = "newest",
) {
  return fetchApi<PaginatedProducts>(
    `/products/shop?page=${page}&sort=${sort}`,
  );
}

export function getProductReviews(slug: string) {
  return fetchApi<Review[]>(`/products/${slug}/reviews`);
}

export function getRelatedProducts(slug: string) {
  return fetchApi<Product[]>(`/products/${slug}/related`);
}

export function getJournalPosts(type?: "blog" | "guide") {
  const q = type ? `?type=${type}` : "";
  return fetchApi<BlogPost[]>(`/storefront/journal${q}`);
}

export function getJournalPost(slug: string) {
  return fetchApi<BlogPost & { body: string }>(`/storefront/journal/${slug}`);
}

export function getStaticPage(slug: string) {
  return fetchApi<{ title: string; body: string; meta?: { title?: string; description?: string } }>(
    `/storefront/pages/${slug}`,
  );
}

export interface SitemapUrls {
  staticPages: { slug: string; updatedAt?: string }[];
  categories: { slug: string; updatedAt?: string }[];
  products: { slug: string; updatedAt?: string }[];
  posts: { slug: string; type: "blog" | "guide"; publishedAt?: string; updatedAt?: string }[];
}

export function getSitemapUrls() {
  return fetchApi<SitemapUrls>("/storefront/sitemap-urls");
}

export interface CheckoutPayload {
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  items: { productId: string; sku: string; quantity: number }[];
}

export interface CheckoutInitResult {
  orderId: string;
  mock: boolean;
  total: number;
  currency: string;
  message?: string;
  razorpayOrderId?: string;
  razorpayKeyId?: string;
  amount?: number;
}

export interface CheckoutCompleteResult {
  id: string;
  status: string;
  total: number;
  currency: string;
}

export interface PaymentConfig {
  provider: string;
  enabled: boolean;
  /** Store setting — false means checkout skips gateway. */
  paymentEnabled?: boolean;
  skipPayment?: boolean;
  keyId?: string;
}

export async function getPaymentConfig() {
  const res = await fetch(`${getRuntimeApiUrl()}/checkout/payment-config`, {
    headers: { "x-tenant-domain": getTenantDomain() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Payment config unavailable: ${res.status}`);
  return res.json() as Promise<PaymentConfig>;
}

export async function checkout(data: CheckoutPayload) {
  const token = typeof window !== "undefined" ? localStorage.getItem("terra_token") : null;
  const res = await fetch(`${getRuntimeApiUrl()}/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-domain": getTenantDomain(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `Checkout failed: ${res.status}`);
  }
  return res.json() as Promise<CheckoutInitResult>;
}

export async function mockPayOrder(orderId: string) {
  const res = await fetch(`${getRuntimeApiUrl()}/checkout/mock-pay/${orderId}`, {
    method: "POST",
    headers: { "x-tenant-domain": getTenantDomain() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `Payment failed: ${res.status}`);
  }
  return res.json() as Promise<CheckoutCompleteResult>;
}

export async function verifyPayment(data: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const res = await fetch(`${getRuntimeApiUrl()}/checkout/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-domain": getTenantDomain(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `Verification failed: ${res.status}`);
  }
  return res.json() as Promise<CheckoutCompleteResult>;
}

export interface OrderDetail {
  id: string;
  status: string;
  total: number;
  currency: string;
  items: { sku: string; title: string; quantity: number; unitPrice: number }[];
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  events?: { type: string; note: string; at: string }[];
  createdAt?: string;
}

export async function getOrder(id: string) {
  const res = await fetch(`${getRuntimeApiUrl()}/checkout/order/${id}`, {
    headers: { "x-tenant-domain": getTenantDomain() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Order not found: ${res.status}`);
  return res.json() as Promise<OrderDetail>;
}

export interface TrackOrderResult extends OrderDetail {
  events: { type: string; note: string; at: string }[];
}

export async function trackOrder(orderId: string, email: string) {
  const params = new URLSearchParams({ orderId, email });
  const res = await fetch(`${getRuntimeApiUrl()}/checkout/track?${params}`, {
    headers: { "x-tenant-domain": getTenantDomain() },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Order not found");
  }
  return res.json() as Promise<TrackOrderResult>;
}
