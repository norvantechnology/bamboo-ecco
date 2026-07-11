import { getRuntimeApiUrl } from "./api-config";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AccountOrder {
  id: string;
  status: string;
  total: number;
  currency: string;
  itemCount: number;
  createdAt: string;
}

let refreshPromise: Promise<string | null> | null = null;

function tenantDomainHeader(): string {
  if (typeof window !== "undefined") {
    return window.location.hostname || "localhost";
  }
  return "localhost";
}

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refresh = localStorage.getItem("terra_refresh");
  if (!refresh) return null;

  try {
    const res = await fetch(`${getRuntimeApiUrl()}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-domain": tenantDomainHeader(),
      },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AuthResponse;
    setCustomerAuth(data);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function customerApi<T>(
  path: string,
  options?: RequestInit & { token?: string; _retry?: boolean },
) {
  const { token: tokenOverride, _retry, ...rest } = options ?? {};
  const token = tokenOverride ?? getCustomerToken();

  const res = await fetch(`${getRuntimeApiUrl()}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      "x-tenant-domain": tenantDomainHeader(),
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
      return customerApi<T>(path, { ...options, token: newToken, _retry: true });
    }
    clearCustomerAuth();
    throw new Error("Session expired. Please sign in again.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getCustomerToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("terra_token");
}

export function setCustomerAuth(data: AuthResponse) {
  localStorage.setItem("terra_token", data.accessToken);
  localStorage.setItem("terra_refresh", data.refreshToken);
  localStorage.setItem("terra_user", JSON.stringify(data.user));
}

export function clearCustomerAuth() {
  localStorage.removeItem("terra_token");
  localStorage.removeItem("terra_refresh");
  localStorage.removeItem("terra_user");
}

export function getCustomerUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("terra_user");
  return raw ? JSON.parse(raw) : null;
}

export function customerLogin(email: string, password: string) {
  return customerApi<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function customerRegister(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) {
  return customerApi<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...data, role: "customer" }),
  });
}

export function isCustomerAuthenticated(): boolean {
  return Boolean(getCustomerToken() && getCustomerUser());
}

export function getAccountOrders() {
  const token = getCustomerToken();
  if (!token) return Promise.reject(new Error("Not authenticated"));
  return customerApi<AccountOrder[]>("/account/orders", { token });
}

export function getAccountOrder(id: string) {
  const token = getCustomerToken();
  if (!token) return Promise.reject(new Error("Not authenticated"));
  return customerApi<AccountOrder & {
    items: { sku: string; title: string; quantity: number; unitPrice: number }[];
    shippingAddress?: { line1: string; city: string; state: string; pincode: string; phone: string };
  }>(`/account/orders/${id}`, { token });
}

export async function searchProducts(q: string, page = 1) {
  const res = await fetch(
    `${getRuntimeApiUrl()}/products/search?q=${encodeURIComponent(q)}&page=${page}`,
    { headers: { "x-tenant-domain": tenantDomainHeader() }, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json() as Promise<{
    data: import("./api").Product[];
    total: number;
    page: number;
    totalPages: number;
  }>;
}
