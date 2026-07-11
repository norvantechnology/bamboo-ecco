"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { checkout, getPaymentConfig, mockPayOrder, verifyPayment } from "@/lib/api";
import { getCustomerUser } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src*="checkout.razorpay.com"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [razorpayEnabled, setRazorpayEnabled] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  useEffect(() => {
    getPaymentConfig()
      .then((cfg) => setRazorpayEnabled(cfg.enabled))
      .catch(() => setRazorpayEnabled(false));

    const user = getCustomerUser();
    if (user) {
      setForm((prev) => ({
        ...prev,
        customerEmail: user.email,
        customerName:
          prev.customerName ||
          [user.firstName, user.lastName].filter(Boolean).join(" "),
      }));
    }
  }, []);

  const openRazorpay = useCallback(
  async (
    init: Awaited<ReturnType<typeof checkout>>,
    customer: { name: string; email: string; phone: string },
  ) => {
    await loadRazorpayScript();

    if (!window.Razorpay || !init.razorpayKeyId || !init.razorpayOrderId) {
      throw new Error("Payment gateway not loaded");
    }

    const rz = new window.Razorpay({
      key: init.razorpayKeyId,
      amount: init.amount,
      currency: init.currency,
      name: "Store",
      description: "Order payment",
      order_id: init.razorpayOrderId,
      prefill: {
        name: customer.name,
        email: customer.email,
        contact: customer.phone,
      },
      theme: { color: "#4B3621" },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const paid = await verifyPayment({
            orderId: init.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          clearCart();
          router.push(`/order/${paid.id}`);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Payment verification failed");
          setLoading(false);
        }
      },
      modal: {
        ondismiss: () => setLoading(false),
      },
    });
    rz.open();
  },
  [clearCart, router],
);

  const loggedInUser = getCustomerUser();

  if (items.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="font-display text-3xl">Nothing to checkout</h1>
        <Link href="/shop" className="mt-8 inline-block">
          <Button>Shop now</Button>
        </Link>
      </div>
    );
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        shippingAddress: {
          line1: form.line1,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          phone: form.phone,
        },
        items: items.map((i) => ({
          productId: i.productId,
          sku: i.sku,
          quantity: i.quantity,
        })),
      };

      const init = await checkout(payload);

      if (init.mock) {
        const paid = await mockPayOrder(init.orderId);
        clearCart();
        router.push(`/order/${paid.id}`);
        return;
      }

      await openRazorpay(init, {
        name: form.customerName,
        email: form.customerEmail,
        phone: form.phone,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(false);
    }
  }

  const paymentLabel =
    razorpayEnabled === null
      ? "Loading payment…"
      : razorpayEnabled
        ? "Pay securely with Razorpay"
        : "Pay now (dev mock — add Razorpay keys to .env)";

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-3xl sm:text-4xl">Checkout</h1>
      <p className="mt-2 text-sm text-muted">
        {razorpayEnabled
          ? "Secure payment powered by Razorpay. UPI, cards, and netbanking accepted."
          : "Razorpay keys not configured — using dev mock payment for local testing."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[1fr_340px] lg:gap-10">
        <div className="space-y-4 sm:space-y-6">
          <section className="data-card">
            <h2 className="font-display text-lg sm:text-xl">Contact</h2>
            {loggedInUser && (
              <p className="mt-2 text-sm text-muted">
                Signed in as{" "}
                <span className="font-medium text-foreground [overflow-wrap:anywhere]">{loggedInUser.email}</span>. Orders will appear in your account.
              </p>
            )}
            <div className="mt-4 grid gap-5">
              <label className="block text-sm">
                <span className="text-muted">Full name</span>
                <input
                  required
                  value={form.customerName}
                  onChange={(e) => updateField("customerName", e.target.value)}
                  className="input-field"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-muted">Email</span>
                <input
                  required
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => updateField("customerEmail", e.target.value)}
                  readOnly={!!loggedInUser}
                  className="input-field read-only:bg-background read-only:text-muted"
                />
              </label>
            </div>
          </section>

          <section className="data-card">
            <h2 className="font-display text-lg sm:text-xl">Shipping address</h2>
            <div className="mt-4 space-y-5">
              <label className="block text-sm">
                <span className="text-muted">Address</span>
                <input
                  required
                  value={form.line1}
                  onChange={(e) => updateField("line1", e.target.value)}
                  className="input-field"
                />
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-muted">City</span>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="input-field"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-muted">State</span>
                  <input
                    required
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    className="input-field"
                  />
                </label>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-muted">PIN code</span>
                  <input
                    required
                    type="text"
                    pattern="[0-9]{6}"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="postal-code"
                    value={form.pincode}
                    onChange={(e) => updateField("pincode", e.target.value)}
                    className="input-field"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-muted">Phone</span>
                  <input
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="input-field"
                  />
                </label>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <aside className="data-card h-fit lg:sticky lg:top-24">
          <h2 className="font-display text-lg sm:text-xl">Your order</h2>
          <ul className="mt-4 space-y-3.5 text-sm">
            {items.map((item) => (
              <li key={`${item.productId}-${item.sku}`} className="flex justify-between gap-3">
                <span className="min-w-0 text-muted">
                  <span className="line-clamp-2 text-foreground">{item.title}</span>
                  <span className="mt-1 block text-xs text-muted">Qty {item.quantity}</span>
                </span>
                <span className="shrink-0 font-medium">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="data-row mt-4 border-t border-border pt-4 font-semibold">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Button type="submit" variant="secondary" className="mt-5 w-full sm:mt-6" disabled={loading || razorpayEnabled === null}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" className="border-surface/30 border-t-surface" /> Processing…
              </span>
            ) : (
              paymentLabel
            )}
          </Button>
        </aside>
      </form>
    </div>
  );
}
