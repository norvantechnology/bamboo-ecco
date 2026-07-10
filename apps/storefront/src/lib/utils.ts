import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

const ATTR_LABELS: Record<string, string> = {
  pieces: "pieces",
  piece: "pieces",
  finish: "finish",
  size: "",
  slots: "slots",
  length: "",
  extendable: "",
};

/** Human-readable subtitle for product cards (avoids raw "4" or "Yes"). */
export function formatVariantSubtitle(attributes?: Record<string, string>): string | null {
  if (!attributes || Object.keys(attributes).length === 0) return null;

  const parts = Object.entries(attributes)
    .map(([key, val]) => {
      const k = key.toLowerCase().trim();
      const v = val.trim();
      if (!v) return null;
      if (v.toLowerCase() === "yes") return k.replace(/_/g, " ");
      if (v.toLowerCase() === "no") return null;
      const suffix = ATTR_LABELS[k];
      if (suffix === "") return v;
      if (suffix) return /^\d+$/.test(v) ? `${v} ${suffix}` : `${v} ${suffix}`;
      return `${k.replace(/_/g, " ")}: ${v}`;
    })
    .filter(Boolean) as string[];

  return parts.length > 0 ? parts.join(" · ") : null;
}

export function getProductCardSubtitle(product: {
  variants: { attributes?: Record<string, string> }[];
  specs?: { material?: string };
}): string | null {
  const variant = product.variants[0];
  const fromAttrs = formatVariantSubtitle(variant?.attributes);

  if (product.variants.length > 1) return fromAttrs;
  if (product.specs?.material) return product.specs.material;
  return fromAttrs;
}

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  fulfilled: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export function formatOrderStatus(status: string) {
  return status.replace(/_/g, " ");
}

export function getOrderStatusClass(status: string) {
  return ORDER_STATUS_STYLES[status] ?? "bg-background text-muted";
}

export function formatOrderNumber(id: string) {
  return `#${id.slice(-8).toUpperCase()}`;
}

export function formatOrderDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
