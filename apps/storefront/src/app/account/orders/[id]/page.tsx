"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAccountOrder } from "@/lib/auth";
import { formatPrice, formatOrderDate, formatOrderNumber, formatOrderStatus, getOrderStatusClass } from "@/lib/utils";
import { PageLoader } from "@/components/ui/loading";
import { AccountShell } from "@/components/account/account-shell";
import { Button } from "@/components/ui/button";
import { DownloadInvoiceButton } from "@/components/order/download-invoice-button";

export default function AccountOrderPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Awaited<ReturnType<typeof getAccountOrder>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getAccountOrder(params.id)
      .then(setOrder)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <AccountShell title="Order details">
        <PageLoader label="Loading order…" />
      </AccountShell>
    );
  }

  if (notFound || !order) {
    return (
      <AccountShell title="Order not found" subtitle="This order may not exist or does not belong to your account.">
        <div className="data-card text-center">
          <Link href="/account">
            <Button variant="outline">Back to orders</Button>
          </Link>
        </div>
      </AccountShell>
    );
  }

  const address = order.shippingAddress;

  return (
    <AccountShell
      title={formatOrderNumber(order.id)}
      subtitle={order.createdAt ? `Placed on ${formatOrderDate(order.createdAt)}` : undefined}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
        <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize sm:text-sm ${getOrderStatusClass(order.status)}`}>
          {formatOrderStatus(order.status)}
        </span>
        <DownloadInvoiceButton orderId={order.id} size="sm" label="Download invoice" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <section className="data-card">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted sm:text-sm">Summary</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="data-row">
              <dt>Items</dt>
              <dd className="font-numeric">{order.items?.length ?? 0}</dd>
            </div>
            <div className="data-row border-t border-border pt-2 font-semibold">
              <dt>Total</dt>
              <dd className="font-numeric">{formatPrice(order.total, order.currency)}</dd>
            </div>
          </dl>
        </section>

        {address && (
          <section className="data-card">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted sm:text-sm">Shipping</h3>
            <address className="mt-3 not-italic text-sm leading-relaxed">
              {address.line1}
              <br />
              {address.city}, {address.state} {address.pincode}
              <br />
              <span className="text-muted">Phone:</span> {address.phone}
            </address>
          </section>
        )}
      </div>

      <section className="data-card mt-3 sm:mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted sm:text-sm">Items</h3>
        <ul className="mt-3 divide-y divide-border">
          {order.items?.map((item) => (
            <li key={item.sku} className="flex items-start justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="font-medium">{item.title}</p>
                <p className="font-numeric text-muted">Qty {item.quantity}</p>
              </div>
              <span className="font-numeric shrink-0 font-medium">
                {formatPrice(item.unitPrice * item.quantity, order.currency)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Link href="/account/track" className="mt-5 inline-block text-sm text-secondary hover:underline">
        Track shipment status →
      </Link>
    </AccountShell>
  );
}
