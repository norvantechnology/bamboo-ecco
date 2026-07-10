import { withHomepageSections } from "./homepage-sections";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const IS_DEV = process.env.NODE_ENV === "development";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-tenant-domain": "localhost",
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
  children?: Category[];
  parent?: { _id: string; slug: string; name: string } | null;
}

export interface CollectionStorySection {
  title: string;
  body: string;
  imageUrl: string;
  align: "left" | "right";
}

export interface CollectionStory {
  headline?: string;
  subheading?: string;
  heroImageUrl?: string;
  sections?: CollectionStorySection[];
}

export interface CollectionData {
  category: Category & { story?: CollectionStory };
  products: Product[];
}

export interface ProductImage {
  url: string;
  alt: string;
  sortOrder: number;
  type?: string;
}

export interface ProductSpecs {
  dimensions?: string;
  weight?: string;
  material?: string;
  careInstructions?: string;
  shippingInfo?: string;
  warranty?: string;
}

export interface Product {
  _id: string;
  slug: string;
  title: string;
  description: string;
  categoryId?: string;
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

export function getShopProducts() {
  return fetchApi<Product[]>("/products/shop");
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

export function getCollection(slug: string) {
  return fetchApi<CollectionData>(`/storefront/collections/${slug}`);
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
  keyId?: string;
}

export async function getPaymentConfig() {
  const res = await fetch(`${API_URL}/checkout/payment-config`, {
    headers: { "x-tenant-domain": "localhost" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Payment config unavailable: ${res.status}`);
  return res.json() as Promise<PaymentConfig>;
}

export async function checkout(data: CheckoutPayload) {
  const token = typeof window !== "undefined" ? localStorage.getItem("terra_token") : null;
  const res = await fetch(`${API_URL}/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-domain": "localhost",
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
  const res = await fetch(`${API_URL}/checkout/mock-pay/${orderId}`, {
    method: "POST",
    headers: { "x-tenant-domain": "localhost" },
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
  const res = await fetch(`${API_URL}/checkout/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tenant-domain": "localhost",
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
  const res = await fetch(`${API_URL}/checkout/order/${id}`, {
    headers: { "x-tenant-domain": "localhost" },
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
  const res = await fetch(`${API_URL}/checkout/track?${params}`, {
    headers: { "x-tenant-domain": "localhost" },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Order not found");
  }
  return res.json() as Promise<TrackOrderResult>;
}
