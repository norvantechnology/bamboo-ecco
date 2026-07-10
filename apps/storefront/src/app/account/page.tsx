"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ChevronRight } from "lucide-react";
import { getAccountOrders, type AccountOrder } from "@/lib/auth";
import { formatPrice, formatOrderDate, formatOrderNumber, formatOrderStatus, getOrderStatusClass } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loading";
import { AccountShell } from "@/components/account/account-shell";
import { MotionListItem } from "@/components/ui/motion";
import { DownloadInvoiceButton } from "@/components/order/download-invoice-button";

export default function AccountPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAccountOrders()
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load orders"))
      .finally(() => setLoading(false));
  }, []);

  const subtitle =
    orders.length > 0
      ? `${orders.length} order${orders.length !== 1 ? "s" : ""} placed with this account`
      : "View and track your purchases";

  return (
    <AccountShell title="Order history" subtitle={subtitle}>
      {loading ? (
        <PageLoader label="Loading orders…" />
      ) : error ? (
        <div className="data-card border-red-200 bg-red-50 text-sm text-red-700">
          <p>{error}</p>
          {error.toLowerCase().includes("session expired") && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/login?next=/account")}>
              Sign in again
            </Button>
          )}
        </div>
      ) : orders.length === 0 ? (
        <div className="data-card text-center">
          <Package className="mx-auto h-10 w-10 text-border" />
          <h3 className="mt-4 font-display text-lg">No orders yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Orders appear here when placed while signed in, or when the checkout email matches your account.
            Used a different email?{" "}
            <Link href="/account/track" className="text-secondary hover:underline">
              Track an order
            </Link>
            .
          </p>
          <Link href="/shop" className="mt-6 inline-block">
            <Button>Start shopping</Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order, i) => (
            <MotionListItem key={order.id} index={i}>
              <div className="data-card group flex flex-col gap-3 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/account/orders/${order.id}`} className="min-w-0 flex-1">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-numeric font-medium">{formatOrderNumber(order.id)}</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getOrderStatusClass(order.status)}`}
                      >
                        {formatOrderStatus(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted">
                      {order.createdAt ? formatOrderDate(order.createdAt) : "—"}
                      {" · "}
                      {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="font-numeric text-lg font-semibold sm:order-first">{formatPrice(order.total, order.currency)}</span>
                  <DownloadInvoiceButton
                    orderId={order.id}
                    size="sm"
                    variant="outline"
                    label="Invoice"
                    className="shrink-0"
                  />
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-secondary hover:text-foreground"
                    aria-label={`View order ${formatOrderNumber(order.id)}`}
                  >
                    <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </MotionListItem>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
