"use client";

import { useState } from "react";
import Link from "next/link";
import { trackOrder } from "@/lib/api";
import { downloadGuestOrderInvoice } from "@/lib/invoice";
import { formatPrice, formatOrderNumber, formatOrderStatus, getOrderStatusClass } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";
import { Download } from "lucide-react";

export function TrackOrderForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Awaited<ReturnType<typeof trackOrder>> | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const result = await trackOrder(orderId.trim(), email.trim());
      setOrder(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order not found");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="data-card space-y-4">
        <label className="block text-sm">
          <span className="text-muted">Order ID</span>
          <input
            required
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="From your confirmation email"
            className="input-field"
          />
        </label>
        <label className="block text-sm">
          <span className="text-muted">Email used at checkout</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
        </label>
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" className="border-surface/30 border-t-surface" /> Looking up…
            </span>
          ) : (
            "Track order"
          )}
        </Button>
      </form>

      {order && (
        <div className="data-card mt-4 sm:mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-numeric text-lg font-semibold">{formatOrderNumber(order.id)}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${getOrderStatusClass(order.status)}`}>
              {formatOrderStatus(order.status)}
            </span>
          </div>
          <div className="data-row mt-3">
            <span className="label">Total</span>
            <span className="value">{formatPrice(order.total, order.currency)}</span>
          </div>
          <ul className="mt-4 divide-y divide-border text-sm">
            {order.items.map((item) => (
              <li key={item.sku} className="flex justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <span className="min-w-0 line-clamp-2">{item.title} × {item.quantity}</span>
                <span className="shrink-0">{formatPrice(item.unitPrice * item.quantity, order.currency)}</span>
              </li>
            ))}
          </ul>
          {order.events.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">Timeline</h4>
              <ul className="mt-3 space-y-3">
                {order.events.map((ev, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                    <div>
                      <p className="font-medium capitalize">{formatOrderStatus(ev.type)}</p>
                      {ev.note && <p className="text-muted">{ev.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link href={`/order/${order.id}`} className="text-sm text-secondary hover:underline">
              View full order details →
            </Link>
            <button
              type="button"
              disabled={downloading}
              onClick={async () => {
                setDownloading(true);
                try {
                  await downloadGuestOrderInvoice(order.id, email.trim());
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to download invoice");
                } finally {
                  setDownloading(false);
                }
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-secondary disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {downloading ? "Preparing…" : "Download invoice"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
