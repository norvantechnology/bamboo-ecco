import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDashboardStats,
  getAdminOrders,
  formatInr,
  type DashboardStats,
  type AdminOrder,
} from "../lib/api";
import { PageLoader } from "../components/Loading";
import { HubCard, PageHeader } from "../components/PageHeader";
import { navGroups } from "../lib/admin-nav";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getAdminOrders()])
      .then(([dashboard, recentOrders]) => {
        setStats(dashboard);
        setOrders(recentOrders);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PageLoader label="Loading dashboard…" />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}. Make sure the API is running on port 4000.
      </div>
    );
  }

  const statusCounts = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, {});

  const cards = [
    { label: "Revenue today", value: formatInr(stats?.revenueToday ?? 0) },
    { label: "Orders today", value: String(stats?.ordersToday ?? 0) },
    { label: "Low stock", value: String(stats?.lowStockCount ?? 0), sub: "items need attention" },
    {
      label: "Top product",
      value: stats?.topProduct?.title ?? "—",
      sub: stats?.topProduct ? `${stats.topProduct.soldCount} sold` : undefined,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Your store at a glance. Use the sections below to jump anywhere — or search in the top bar."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-surface p-4 sm:p-5"
          >
            <p className="text-xs text-muted sm:text-sm">{stat.label}</p>
            <p className="mt-1 line-clamp-2 text-lg font-semibold sm:text-2xl">{stat.value}</p>
            {stat.sub && <p className="mt-0.5 text-xs text-muted">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {navGroups.map((group) => (
        <section key={group.id}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
            {group.label}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {group.items.map((item) => (
              <HubCard
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                description={item.description}
              />
            ))}
          </div>
        </section>
      ))}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold sm:text-lg">Recent orders</h2>
            <Link to="/orders" className="text-xs font-medium text-secondary hover:underline">
              View all →
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[400px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="px-4 py-2 font-medium sm:px-0">Order</th>
                    <th className="px-4 py-2 font-medium">Customer</th>
                    <th className="px-4 py-2 font-medium">Total</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 8).map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border last:border-0 hover:bg-background/50"
                    >
                      <td className="px-4 py-3 font-medium sm:px-0">
                        <Link to={`/orders/${order.id}`} className="hover:underline">
                          #{order.id.slice(-6)}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{order.customer}</td>
                      <td className="px-4 py-3">{formatInr(order.total)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-background px-2.5 py-0.5 text-xs font-medium capitalize">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
          <h2 className="mb-4 text-base font-semibold sm:text-lg">Orders by status</h2>
          {Object.keys(statusCounts).length === 0 ? (
            <p className="text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <li key={status} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{status}</span>
                  <span className="font-medium">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-8 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">Coming in the next build phase.</p>
    </div>
  );
}
