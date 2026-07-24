import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Package } from "lucide-react";
import { getOrder, getHomepage } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DownloadInvoiceButton } from "@/components/order/download-invoice-button";
import { GoogleReviewsOptIn } from "@/components/promo/google-reviews-optin";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Order Confirmation",
};

export default async function OrderConfirmationPage({ params }: Props) {
  const { id } = await params;
  const [order, homepageData] = await Promise.all([
    getOrder(id).catch(() => null),
    getHomepage().catch(() => null),
  ]);

  if (!order) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="font-display text-3xl">Order not found</h1>
        <Link href="/shop" className="mt-8 inline-block">
          <Button>Continue shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12 sm:py-16">
      {/* Official Google Customer Reviews Order Opt-in Survey Modal */}
      <GoogleReviewsOptIn
        config={homepageData?.promotions?.googleCustomerReviews}
        orderId={order.id}
        email={order.customerEmail}
        createdAt={order.createdAt}
        products={order.items}
      />

      <div className="mx-auto max-w-xl text-center">
        <CheckCircle className="mx-auto h-14 w-14 text-secondary" />
        <h1 className="mt-6 font-display text-3xl sm:text-4xl">Thank you for your order</h1>
        <p className="mt-3 text-muted">
          Order <span className="font-mono text-foreground">{order.id.slice(-8)}</span> has been
          confirmed.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-xl rounded-lg border border-border bg-surface p-6">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Status</dt>
            <dd className="capitalize">{order.status}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Total</dt>
            <dd className="font-semibold">{formatPrice(order.total, order.currency)}</dd>
          </div>
          {order.customerName && (
            <div className="flex justify-between">
              <dt className="text-muted">Name</dt>
              <dd>{order.customerName}</dd>
            </div>
          )}
          {order.customerEmail && (
            <div className="flex justify-between">
              <dt className="text-muted">Email</dt>
              <dd>{order.customerEmail}</dd>
            </div>
          )}
        </dl>

        {order.items.length > 0 && (
          <div className="mt-6 border-t border-border pt-6">
            <h2 className="font-medium">Items</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {order.items.map((item) => (
                <li key={item.sku} className="flex justify-between">
                  <span>
                    {item.title} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.unitPrice * item.quantity, order.currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {order.shippingAddress && (
          <div className="mt-6 border-t border-border pt-6 text-sm">
            <h2 className="font-medium">Shipping to</h2>
            <p className="mt-2 text-muted">
              {order.shippingAddress.line1}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
              {order.shippingAddress.pincode}
              <br />
              {order.shippingAddress.phone}
            </p>
          </div>
        )}

        {order.events && order.events.length > 0 && (
          <div className="mt-6 border-t border-border pt-6">
            <h2 className="flex items-center gap-2 font-medium">
              <Package className="h-4 w-4" /> Order timeline
            </h2>
            <ul className="mt-4 space-y-3">
              {order.events.map((ev, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                  <div>
                    <p className="capitalize font-medium">{ev.type}</p>
                    {ev.note && <p className="text-muted">{ev.note}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <DownloadInvoiceButton orderId={order.id} email={order.customerEmail} />
        <Link href="/track-order">
          <Button variant="outline">Track order</Button>
        </Link>
        <Link href="/shop">
          <Button variant="outline">Continue shopping</Button>
        </Link>
      </div>
    </div>
  );
}
