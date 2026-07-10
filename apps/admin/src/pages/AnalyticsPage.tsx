import { useEffect, useState } from "react";
import { getDashboardStats, getAdminOrders, formatInr, type DashboardStats, type AdminOrder } from "../lib/api";

export function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  useEffect(() => {
    Promise.all([getDashboardStats(), getAdminOrders()])
      .then(([s, o]) => { setStats(s); setOrders(o); })
      .catch(() => {});
  }, []);

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">Analytics</h1>
        <p className="text-sm text-muted">Store performance overview</p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm text-muted">Revenue today</p>
            <p className="mt-1 text-2xl font-semibold">{formatInr(stats.revenueToday)}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm text-muted">Orders today</p>
            <p className="mt-1 text-2xl font-semibold">{stats.ordersToday}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm text-muted">Low stock items</p>
            <p className="mt-1 text-2xl font-semibold">{stats.lowStockCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-sm text-muted">Top product</p>
            <p className="mt-1 text-lg font-semibold truncate">{stats.topProduct?.title ?? "—"}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Orders by status</h2>
        <ul className="mt-4 space-y-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <li key={status} className="flex items-center justify-between text-sm">
              <span className="capitalize">{status}</span>
              <span className="font-medium">{count}</span>
            </li>
          ))}
          {Object.keys(statusCounts).length === 0 && <p className="text-sm text-muted">No orders yet.</p>}
        </ul>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-semibold">Recent orders</h2>
        <ul className="mt-4 divide-y divide-border">
          {orders.slice(0, 10).map((o) => (
            <li key={o.id} className="flex justify-between py-3 text-sm">
              <span>{o.customer} · <span className="capitalize text-muted">{o.status}</span></span>
              <span className="font-medium">{formatInr(o.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
