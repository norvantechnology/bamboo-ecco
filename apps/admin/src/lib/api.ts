const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const ADMIN_ROLES = new Set(["owner", "manager", "support", "read-only"]);

export function isAdminRole(role?: string | null) {
  return Boolean(role && ADMIN_ROLES.has(role));
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string; firstName?: string };
}

let refreshPromise: Promise<string | null> | null = null;

function redirectToLogin() {
  clearStoredAuth();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.assign("/login");
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("ecoo_refresh");
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-domain": "localhost",
      },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AuthResponse;
    if (!isAdminRole(data.user.role)) {
      clearStoredAuth();
      return null;
    }
    setStoredAuth(data);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function authFetch(
  path: string,
  options?: RequestInit & { token?: string; _retry?: boolean },
): Promise<Response> {
  const { token: tokenOverride, _retry, ...rest } = options ?? {};
  const token = tokenOverride ?? getStoredToken();
  const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...rest,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      "x-tenant-domain": "localhost",
      Pragma: "no-cache",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
  });

  if (res.status === 401 && !_retry) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      return authFetch(path, { ...options, token: newToken, _retry: true });
    }
    redirectToLogin();
    throw new Error("Session expired. Please sign in again.");
  }

  return res;
}

export async function api<T>(
  path: string,
  options?: RequestInit & { token?: string },
): Promise<T> {
  const { token, ...rest } = options ?? {};
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...rest,
    headers: {
      "Content-Type": "application/json",
      "x-tenant-domain": "localhost",
      Pragma: "no-cache",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export interface DashboardStats {
  revenueToday: number;
  ordersToday: number;
  lowStockCount: number;
  topProduct: { title: string; soldCount: number } | null;
}

export interface AdminOrder {
  id: string;
  customer: string;
  customerEmail?: string;
  total: number;
  currency: string;
  status: string;
  itemCount: number;
  createdAt: string;
}

export interface AdminProduct {
  _id: string;
  categoryId?: string;
  title: string;
  slug: string;
  description?: string;
  status: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  images?: { url: string; alt: string; sortOrder?: number; type?: string }[];
  variants: { sku: string; price: number; currency: string; stockQty: number }[];
  ratingSummary: { avg: number; count: number };
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

export interface AdminCategory {
  _id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  parentId?: string | null;
  meta?: { title?: string; description?: string };
  story?: CollectionStory;
  children?: AdminCategory[];
}

export function login(email: string, password: string) {
  return api<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getStoredToken() {
  return localStorage.getItem("ecoo_token");
}

export function getStoredRefreshToken() {
  return localStorage.getItem("ecoo_refresh");
}

export function setStoredAuth(data: AuthResponse) {
  localStorage.setItem("ecoo_token", data.accessToken);
  localStorage.setItem("ecoo_refresh", data.refreshToken);
  localStorage.setItem("ecoo_user", JSON.stringify(data.user));
}

export function clearStoredAuth() {
  localStorage.removeItem("ecoo_token");
  localStorage.removeItem("ecoo_refresh");
  localStorage.removeItem("ecoo_user");
}

export function getStoredUser(): AuthResponse["user"] | null {
  const raw = localStorage.getItem("ecoo_user");
  return raw ? JSON.parse(raw) : null;
}

export function isAdminAuthenticated() {
  const user = getStoredUser();
  return Boolean((getStoredToken() || getStoredRefreshToken()) && user && isAdminRole(user.role));
}

async function authApi<T>(path: string, options?: Omit<RequestInit, "headers"> & { token?: string }) {
  if (!isAdminAuthenticated()) {
    redirectToLogin();
    throw new Error("Not authenticated");
  }

  const res = await authFetch(path, options);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      redirectToLogin();
    }
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getDashboardStats() {
  return authApi<DashboardStats>("/admin/dashboard");
}

export function getAdminOrders() {
  return authApi<AdminOrder[]>("/admin/orders");
}

export interface AdminOrderDetail {
  id: string;
  customerName?: string;
  customerEmail?: string;
  status: string;
  total: number;
  currency: string;
  items: { sku: string; title: string; quantity: number; unitPrice: number }[];
  shippingAddress?: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  paymentProvider?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  events: { type: string; note: string; at: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export function getAdminOrder(id: string) {
  return authApi<AdminOrderDetail>(`/admin/orders/${id}`);
}

export async function downloadAdminOrderInvoice(orderId: string) {
  if (!isAdminAuthenticated()) {
    redirectToLogin();
    throw new Error("Not authenticated");
  }
  const res = await authFetch(`/admin/orders/${orderId}/invoice`);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) redirectToLogin();
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Failed to download invoice");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `invoice-${orderId.slice(-8)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function updateOrderStatus(id: string, status: string, note?: string) {
  return authApi<AdminOrder>(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
}

export function getAdminProducts() {
  return authApi<AdminProduct[]>("/admin/products");
}

export interface ProductPayload {
  categoryId: string;
  slug: string;
  title: string;
  description?: string;
  status?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  images?: { url: string; alt: string; sortOrder?: number; type?: string }[];
  variants: { sku: string; price: number; currency?: string; stockQty: number }[];
}

export function createProduct(data: ProductPayload) {
  return authApi<AdminProduct>("/admin/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProduct(id: string, data: ProductPayload) {
  return authApi<AdminProduct>(`/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProduct(id: string) {
  return authApi<{ deleted: boolean }>(`/admin/products/${id}`, { method: "DELETE" });
}

export function getAdminCategories() {
  return authApi<AdminCategory[]>("/admin/categories");
}

export function getAdminCategoryTree() {
  return authApi<AdminCategory[]>("/admin/categories/tree");
}

export interface CategoryPayload {
  slug: string;
  name: string;
  imageUrl?: string;
  parentId?: string | null;
  meta?: { title?: string; description?: string };
  story?: CollectionStory;
}

export function createCategory(data: CategoryPayload) {
  return authApi<AdminCategory>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCategory(id: string, data: CategoryPayload) {
  return authApi<AdminCategory>(`/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCategory(id: string) {
  return authApi<{ deleted: boolean }>(`/admin/categories/${id}`, { method: "DELETE" });
}

export interface AdminRedirect {
  _id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
}

export function getAdminRedirects() {
  return authApi<AdminRedirect[]>("/admin/redirects");
}

export function createRedirect(data: { fromPath: string; toPath: string; statusCode?: number }) {
  return authApi<AdminRedirect>("/admin/redirects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteRedirect(id: string) {
  return authApi<{ deleted: boolean }>(`/admin/redirects/${id}`, { method: "DELETE" });
}

export interface AdminReview {
  _id: string;
  reviewerName: string;
  rating: number;
  body: string;
  photos?: string[];
  status: string;
  productId?: { _id?: string; title: string; slug: string } | string;
}

export function getAdminReviews(status?: string) {
  const q = status ? `?status=${status}` : "";
  return authApi<AdminReview[]>(`/admin/reviews${q}`);
}

export function createReview(data: {
  productId: string;
  reviewerName: string;
  rating: number;
  body: string;
  photos?: string[];
  status?: "pending" | "approved" | "rejected";
}) {
  return authApi<AdminReview>("/admin/reviews", { method: "POST", body: JSON.stringify(data) });
}

export function updateReview(
  id: string,
  data: Partial<{
    productId: string;
    reviewerName: string;
    rating: number;
    body: string;
    photos: string[];
    status: "pending" | "approved" | "rejected";
  }>,
) {
  return authApi<AdminReview>(`/admin/reviews/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteReview(id: string) {
  return authApi<{ deleted: boolean }>(`/admin/reviews/${id}`, { method: "DELETE" });
}

export function updateReviewStatus(id: string, status: "approved" | "rejected" | "pending") {
  return authApi<AdminReview>(`/admin/reviews/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export interface AdminCustomer {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt?: string;
}

export function getAdminCustomers() {
  return authApi<AdminCustomer[]>("/admin/customers");
}

export function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface AdminContentPage {
  _id: string;
  slug: string;
  title: string;
  body: string;
  type: string;
  footerGroup?: "explore" | "help" | "legal" | null;
  footerOrder?: number;
  meta?: { title?: string; description?: string };
}

export function getAdminContent(type?: string) {
  const q = type ? `?type=${type}` : "";
  return authApi<AdminContentPage[]>(`/admin/content${q}`);
}

export function createContentPage(data: {
  slug: string;
  title: string;
  body: string;
  type: string;
  meta?: { title?: string; description?: string };
  footerGroup?: "explore" | "help" | "legal" | null;
  footerOrder?: number;
}) {
  return authApi<AdminContentPage>("/admin/content", { method: "POST", body: JSON.stringify(data) });
}

export function updateContentPage(
  id: string,
  data: Partial<{
    slug: string;
    title: string;
    body: string;
    type: string;
    meta: { title?: string; description?: string };
    footerGroup: "explore" | "help" | "legal" | null;
    footerOrder: number;
  }>,
) {
  return authApi<AdminContentPage>(`/admin/content/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteContentPage(id: string) {
  return authApi<{ deleted: boolean }>(`/admin/content/${id}`, { method: "DELETE" });
}

export interface AdminGalleryItem {
  _id: string;
  imageUrl: string;
  caption: string;
  instagramUrl: string;
  sortOrder: number;
}

export function getAdminGallery() {
  return authApi<AdminGalleryItem[]>("/admin/gallery");
}

export function createGalleryItem(data: { imageUrl: string; caption?: string; instagramUrl?: string; sortOrder?: number }) {
  return authApi<AdminGalleryItem>("/admin/gallery", { method: "POST", body: JSON.stringify(data) });
}

export function updateGalleryItem(id: string, data: Partial<{ imageUrl: string; caption: string; instagramUrl: string; sortOrder: number }>) {
  return authApi<AdminGalleryItem>(`/admin/gallery/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteGalleryItem(id: string) {
  return authApi<{ deleted: boolean }>(`/admin/gallery/${id}`, { method: "DELETE" });
}

export interface MediaConfig {
  configured: boolean;
  cloudName?: string;
  folder?: string;
}

export function getMediaConfig() {
  return authApi<MediaConfig>("/admin/media/config");
}

export interface UploadMediaResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  alt?: string;
}

export async function uploadMedia(
  file: File,
  options?: { folder?: string; alt?: string; caption?: string; slug?: string },
): Promise<UploadMediaResult> {
  if (!isAdminAuthenticated()) {
    redirectToLogin();
    throw new Error("Not authenticated");
  }

  const form = new FormData();
  form.append("file", file);
  if (options?.folder) form.append("folder", options.folder);
  if (options?.alt) form.append("alt", options.alt);
  if (options?.caption) form.append("caption", options.caption);
  if (options?.slug) form.append("slug", options.slug);

  const res = await authFetch("/admin/media/upload", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) redirectToLogin();
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `Upload failed (${res.status})`);
  }
  return res.json();
}

export interface TenantSeoSettings {
  description: string;
  defaultTitle: string;
  locale: string;
  themeColor: string;
  backgroundColor: string;
  gscVerification: string;
}

export interface TenantSettings {
  name: string;
  tagline: string;
  /** When false, checkout skips online payment and still places the order. */
  paymentEnabled?: boolean;
  hero: {
    headline: string;
    subheading: string;
    imageUrl?: string;
    mobileImageUrl?: string;
    imageUrls?: string[];
    mobileImageUrls?: string[];
    primaryCta: string;
    secondaryCta: string;
  };
  brandPillars: { icon: string; title: string; description: string }[];
  whyChooseUs: { icon: string; title: string; description: string }[];
  seo?: TenantSeoSettings;
  homepageSections?: HomepageSections;
  welcomePopup?: {
    enabled: boolean;
    mode: "html" | "image";
    html: string;
    imageUrl: string;
    imageLink: string;
  };
  announcementBar?: {
    enabled: boolean;
    html: string;
    backgroundColor: string;
    textColor: string;
    animation: "marquee" | "pulse" | "slide" | "none";
    dismissible: boolean;
  };
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

export type HomepageSections = {
  collections: HomepageSection;
  lifestyle: HomepageSection;
  newArrivals: HomepageSection;
  bestSellers: HomepageSection;
  whyChooseUs: HomepageSection;
  customerHomes: HomepageSection;
  reviews: HomepageSection;
  journal: HomepageSection;
  gallery: HomepageSection;
};

export interface CustomerPhotoItem {
  _id: string;
  imageUrl: string;
  caption: string;
  customerName: string;
  published: boolean;
  sortOrder: number;
  productId?: string;
}

export function getCustomerPhotos() {
  return authApi<CustomerPhotoItem[]>("/admin/customer-photos");
}

export function createCustomerPhoto(data: {
  imageUrl: string;
  caption?: string;
  customerName?: string;
  published?: boolean;
  sortOrder?: number;
}) {
  return authApi<CustomerPhotoItem>("/admin/customer-photos", { method: "POST", body: JSON.stringify(data) });
}

export function updateCustomerPhoto(
  id: string,
  data: Partial<{ imageUrl: string; caption: string; customerName: string; published: boolean; sortOrder: number }>,
) {
  return authApi<CustomerPhotoItem>(`/admin/customer-photos/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteCustomerPhoto(id: string) {
  return authApi<{ deleted: boolean }>(`/admin/customer-photos/${id}`, { method: "DELETE" });
}

export function getAdminSettings() {
  return authApi<TenantSettings>("/admin/settings");
}

export function updateAdminSettings(data: Partial<TenantSettings>) {
  return authApi<TenantSettings>("/admin/settings", { method: "PUT", body: JSON.stringify(data) });
}
