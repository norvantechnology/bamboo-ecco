import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAdminOrders,
  updateOrderStatus,
  formatInr,
  type AdminOrder,
} from "../lib/api";
import { PageLoader, Spinner } from "../components/Loading";

const STATUSES = ["pending", "paid", "fulfilled", "shipped", "delivered", "cancelled", "refunded"] as const;

export function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  function load() {
    setLoading(true);
    getAdminOrders()
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load orders"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStatusChange(orderId: string, status: string) {
    setUpdating(orderId);
    try {
      const updated = await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setUpdating(null);
    }
  }

  if (loading) return <PageLoader label="Loading orders…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">Orders</h1>
        <p className="text-sm text-muted">{orders.length} orders</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0 hover:bg-background/50">
                <td className="px-4 py-3 font-mono text-xs">{order.id.slice(-8)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{order.customer}</p>
                  {order.customerEmail && (
                    <p className="text-xs text-muted">{order.customerEmail}</p>
                  )}
                </td>
                <td className="px-4 py-3">{order.itemCount}</td>
                <td className="px-4 py-3">{formatInr(order.total)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={order.status}
                      disabled={updating === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="rounded-lg border border-border bg-background px-2 py-1 text-sm capitalize"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {updating === order.id && <Spinner size="sm" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("en-IN")
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/orders/${order.id}`}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-background"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
