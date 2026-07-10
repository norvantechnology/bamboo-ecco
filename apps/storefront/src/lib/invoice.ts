const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
  const res = await fetch(`${API_URL}/account/orders/${orderId}/invoice`, {
    headers: {
      "x-tenant-domain": "localhost",
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
  const res = await fetch(`${API_URL}/checkout/order/${orderId}/invoice?${params}`, {
    headers: { "x-tenant-domain": "localhost" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Failed to download invoice");
  }
  const blob = await res.blob();
  triggerDownload(blob, `invoice-${orderId.slice(-8)}.pdf`);
}
