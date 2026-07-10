import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import {
  getAdminOrder,
  updateOrderStatus,
  downloadAdminOrderInvoice,
  formatInr,
  type AdminOrderDetail,
} from "../lib/api";
import { PageLoader, Spinner } from "../components/Loading";

const STATUSES = ["pending", "paid", "fulfilled", "shipped", "delivered", "cancelled", "refunded"] as const;

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [note, setNote] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    getAdminOrder(id)
      .then(setOrder)
      .catch((err) => setError(err instanceof Error ? err.message : "Order not found"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusChange(status: string) {
    if (!order) return;
    setUpdating(true);
    setError("");
    try {
      await updateOrderStatus(order.id, status, note || undefined);
      const refreshed = await getAdminOrder(order.id);
      setOrder(refreshed);
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <PageLoader label="Loading order details…" />;

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-muted">{error || "Order not found"}</p>
        <Link to="/orders" className="mt-4 inline-block text-sm text-foreground hover:underline">← Back to orders</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Order {order.id.slice(-8)}</h1>
          <p className="text-sm text-muted">
            {order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={downloading}
            onClick={async () => {
              setDownloading(true);
              setError("");
              try {
                await downloadAdminOrderInvoice(order.id);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Invoice download failed");
              } finally {
                setDownloading(false);
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-background disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Preparing…" : "Download invoice"}
          </button>
          <span className="rounded-full bg-background px-4 py-1.5 text-sm font-medium capitalize">{order.status}</span>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <h2 className="font-semibold">Customer</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Name</dt><dd>{order.customerName ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Email</dt><dd>{order.customerEmail ?? "—"}</dd></div>
          </dl>
          {order.shippingAddress && (
            <>
              <h3 className="pt-2 font-medium text-sm">Shipping address</h3>
              <p className="text-sm text-muted">
                {order.shippingAddress.line1}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
                {order.shippingAddress.phone}
              </p>
            </>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <h2 className="font-semibold">Payment</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Total</dt><dd className="font-semibold">{formatInr(order.total)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Provider</dt><dd className="capitalize">{order.paymentProvider ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Payment ID</dt><dd className="font-mono text-xs">{order.paymentId ?? "—"}</dd></div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Line items</h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted text-left">
              <th className="pb-2 font-medium">Product</th>
              <th className="pb-2 font-medium">SKU</th>
              <th className="pb-2 font-medium">Qty</th>
              <th className="pb-2 font-medium text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.sku} className="border-b border-border last:border-0">
                <td className="py-3">{item.title}</td>
                <td className="py-3 font-mono text-xs text-muted">{item.sku}</td>
                <td className="py-3">{item.quantity}</td>
                <td className="py-3 text-right">{formatInr(item.unitPrice * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Update status</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={updating || order.status === s}
              onClick={() => handleStatusChange(s)}
              className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors disabled:opacity-40 ${
                order.status === s ? "border-foreground bg-foreground text-surface" : "border-border hover:bg-background"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note for status change"
          className="mt-4 w-full max-w-md rounded-lg border border-border px-3 py-2 text-sm"
        />
        {updating && (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Spinner size="sm" /> Updating…
          </p>
        )}
      </div>

      {order.events.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-semibold">Timeline</h2>
          <ul className="mt-4 space-y-4">
            {order.events.map((ev, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                <div>
                  <p className="font-medium capitalize">{ev.type}</p>
                  {ev.note && <p className="text-muted">{ev.note}</p>}
                  <p className="text-xs text-muted">{new Date(ev.at).toLocaleString("en-IN")}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
