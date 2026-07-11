import { getRuntimeApiUrl, getTenantDomain } from "./api-config";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadAccountOrderInvoice(orderId: string, token: string) {
  const res = await fetch(`${getRuntimeApiUrl()}/account/orders/${orderId}/invoice`, {
    headers: {
      "x-tenant-domain": getTenantDomain(),
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Failed to download invoice");
  }
  const blob = await res.blob();
  triggerDownload(blob, `invoice-${orderId.slice(-8)}.pdf`);
}

export async function downloadGuestOrderInvoice(orderId: string, email: string) {
  const params = new URLSearchParams({ email });
  const res = await fetch(`${getRuntimeApiUrl()}/checkout/order/${orderId}/invoice?${params}`, {
    headers: { "x-tenant-domain": getTenantDomain() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Failed to download invoice");
  }
  const blob = await res.blob();
  triggerDownload(blob, `invoice-${orderId.slice(-8)}.pdf`);
}
