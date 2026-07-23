"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, MapPin, Phone, ShieldCheck, Home } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { checkout, getPaymentConfig, mockPayOrder, verifyPayment } from "@/lib/api";
import { getCustomerUser } from "@/lib/auth";
import { formatPrice, cn } from "@/lib/utils";
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

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [razorpayEnabled, setRazorpayEnabled] = useState<boolean | null>(null);
  const [skipPayment, setSkipPayment] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getPaymentConfig()
      .then((cfg) => {
        setRazorpayEnabled(cfg.enabled);
        setSkipPayment(Boolean(cfg.skipPayment) || !cfg.enabled);
      })
      .catch(() => {
        setRazorpayEnabled(false);
        setSkipPayment(true);
      });

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

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const validateField = (field: string, value: string) => {
    let err = "";
    if (!value.trim()) {
      err = "This field is required";
    } else if (field === "customerEmail" && !/\S+@\S+\.\S+/.test(value)) {
      err = "Please enter a valid email address";
    } else if (field === "pincode" && !/^\d{6}$/.test(value)) {
      err = "PIN code must be exactly 6 digits";
    } else if (field === "phone" && !/^\d{10,12}$/.test(value)) {
      err = "Please enter a valid phone number";
    }
    setErrors((prev) => ({ ...prev, [field]: err }));
    return !err;
  };

  const handleBlur = (field: string, value: string) => {
    validateField(field, value);
  };

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
        theme: { color: "#4A5D3E" },
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
            setIsSuccess(true);
            setTimeout(() => {
              clearCart();
              router.push(`/order/${paid.id}`);
            }, 1500);
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
      <div className="container-page max-w-xl mx-auto py-16 text-center">
        <h1 className="font-display text-3xl font-semibold">Nothing to checkout</h1>
        <p className="mt-2 text-muted">Your shopping cart is currently empty.</p>
        <Link href="/shop" className="mt-8 inline-block">
          <Button className="bg-[#4A5D3E] hover:bg-[#3D4D33] text-[#FAF8F5] rounded-xl px-8 shadow-sm">
            Shop now
          </Button>
        </Link>
      </div>
    );
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      validateField(field, value);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Trigger validation across all fields
    const fieldsToValidate = ["customerName", "customerEmail", "line1", "city", "state", "pincode", "phone"];
    let isValid = true;
    fieldsToValidate.forEach((f) => {
      const fieldVal = f === "line1" || f === "city" || f === "state" || f === "pincode" || f === "phone"
        ? form[f]
        : form[f as keyof typeof form];
      if (!validateField(f, fieldVal)) {
        isValid = false;
      }
    });

    if (!isValid) {
      setError("Please check details in required form fields.");
      return;
    }

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
        setIsSuccess(true);
        setTimeout(() => {
          clearCart();
          router.push(`/order/${paid.id}`);
        }, 1500);
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
      ? "Loading…"
      : razorpayEnabled
        ? "Pay securely with Razorpay"
        : "Place order";

  const isFreeShipping = subtotal > 1999;
  const shippingCost = isFreeShipping ? 0 : 150;
  const estGst = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + shippingCost;

  return (
    <div className="container-page max-w-[1440px] mx-auto py-6 sm:py-12 relative">
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-[#4A5D3E] text-white shadow-lg"
            >
              <motion.svg
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="h-10 w-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </motion.svg>
            </motion.div>
            <h2 className="mt-6 font-display text-2xl font-semibold text-foreground">Order Placed Successfully!</h2>
            <p className="mt-2 text-sm text-muted">Redirecting you to your confirmation page...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Flow Steps */}
      <div className="flex items-center gap-2 mb-8 text-xs font-semibold uppercase tracking-wider text-muted sm:text-sm">
        <Link href="/cart" className="hover:text-foreground transition-colors">Cart</Link>
        <span className="text-muted/40">/</span>
        <span className="text-[#C9A24B] font-bold">Checkout</span>
        <span className="text-muted/40">/</span>
        <span className="text-muted/50 cursor-default">Confirmation</span>
      </div>

      <h1 className="font-display text-2xl sm:text-4xl text-foreground">Checkout</h1>
      <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed max-w-xl">
        {razorpayEnabled
          ? "Secure checkout powered by Razorpay. UPI, credit/debit cards, and netbanking accepted."
          : skipPayment
            ? "Enter your delivery details below to place your order. Online payment is not required."
            : "Enter your delivery details below to place your order."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px] lg:gap-10">
        
        {/* Left Column: Form Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Contact Information card */}
          <motion.section
            variants={sectionVariants}
            className="rounded-2xl border border-border/50 bg-[#FAF8F5]/5 p-5 sm:p-6 shadow-warm"
          >
            <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">Contact</h2>
            {loggedInUser && (
              <p className="mt-2 text-xs text-muted">
                Signed in as{" "}
                <span className="font-semibold text-foreground [overflow-wrap:anywhere]">{loggedInUser.email}</span>. Orders will be saved under this profile.
              </p>
            )}
            
            <div className="mt-4 grid gap-5">
              <label className="block text-sm">
                <span className="text-muted font-medium">Full name</span>
                <div className="relative mt-1.5">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                  <input
                    required
                    value={form.customerName}
                    onChange={(e) => updateField("customerName", e.target.value)}
                    onBlur={(e) => handleBlur("customerName", e.target.value)}
                    className={cn(
                      "w-full rounded-xl border bg-background pl-10 pr-4 h-11 text-sm text-foreground transition-all duration-200 outline-none",
                      errors.customerName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border/70 focus:border-[#C9A24B] focus:ring-[#C9A24B]/20 focus:ring-2"
                    )}
                    placeholder="Enter your name"
                  />
                </div>
                {errors.customerName && (
                  <span className="mt-1.5 block text-xs text-red-500 font-medium">{errors.customerName}</span>
                )}
              </label>

              <label className="block text-sm">
                <span className="text-muted font-medium">Email address</span>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                  <input
                    required
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => updateField("customerEmail", e.target.value)}
                    onBlur={(e) => handleBlur("customerEmail", e.target.value)}
                    readOnly={!!loggedInUser}
                    className={cn(
                      "w-full rounded-xl border bg-background pl-10 pr-4 h-11 text-sm text-foreground transition-all duration-200 outline-none read-only:bg-background/40 read-only:text-muted",
                      errors.customerEmail ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border/70 focus:border-[#C9A24B] focus:ring-[#C9A24B]/20 focus:ring-2"
                    )}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.customerEmail && (
                  <span className="mt-1.5 block text-xs text-red-500 font-medium">{errors.customerEmail}</span>
                )}
              </label>
            </div>
          </motion.section>

          {/* Shipping Address card */}
          <motion.section
            variants={sectionVariants}
            className="rounded-2xl border border-border/50 bg-[#FAF8F5]/5 p-5 sm:p-6 shadow-warm"
          >
            <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">Shipping address</h2>
            
            <div className="mt-4 space-y-5">
              <label className="block text-sm">
                <span className="text-muted font-medium">Street address</span>
                <div className="relative mt-1.5">
                  <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                  <input
                    required
                    value={form.line1}
                    onChange={(e) => updateField("line1", e.target.value)}
                    onBlur={(e) => handleBlur("line1", e.target.value)}
                    className={cn(
                      "w-full rounded-xl border bg-background pl-10 pr-4 h-11 text-sm text-foreground transition-all duration-200 outline-none",
                      errors.line1 ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border/70 focus:border-[#C9A24B] focus:ring-[#C9A24B]/20 focus:ring-2"
                    )}
                    placeholder="Apartment, suite, unit, block, street name"
                  />
                </div>
                {errors.line1 && (
                  <span className="mt-1.5 block text-xs text-red-500 font-medium">{errors.line1}</span>
                )}
              </label>

              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-muted font-medium">City</span>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    onBlur={(e) => handleBlur("city", e.target.value)}
                    className={cn(
                      "w-full rounded-xl border bg-background px-4 mt-1.5 h-11 text-sm text-foreground transition-all duration-200 outline-none",
                      errors.city ? "border-red-500 focus:border-red-500" : "border-border/70 focus:border-[#C9A24B] focus:ring-[#C9A24B]/20 focus:ring-2"
                    )}
                    placeholder="City"
                  />
                  {errors.city && (
                    <span className="mt-1.5 block text-xs text-red-500 font-medium">{errors.city}</span>
                  )}
                </label>

                <label className="block text-sm">
                  <span className="text-muted font-medium">State</span>
                  <input
                    required
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    onBlur={(e) => handleBlur("state", e.target.value)}
                    className={cn(
                      "w-full rounded-xl border bg-background px-4 mt-1.5 h-11 text-sm text-foreground transition-all duration-200 outline-none",
                      errors.state ? "border-red-500 focus:border-red-500" : "border-border/70 focus:border-[#C9A24B] focus:ring-[#C9A24B]/20 focus:ring-2"
                    )}
                    placeholder="State"
                  />
                  {errors.state && (
                    <span className="mt-1.5 block text-xs text-red-500 font-medium">{errors.state}</span>
                  )}
                </label>
              </div>

              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-muted font-medium">PIN code</span>
                  <div className="relative mt-1.5">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                    <input
                      required
                      type="text"
                      pattern="[0-9]{6}"
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="postal-code"
                      value={form.pincode}
                      onChange={(e) => updateField("pincode", e.target.value)}
                      onBlur={(e) => handleBlur("pincode", e.target.value)}
                      className={cn(
                        "w-full rounded-xl border bg-background pl-10 pr-4 h-11 text-sm text-foreground transition-all duration-200 outline-none",
                        errors.pincode ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border/70 focus:border-[#C9A24B] focus:ring-[#C9A24B]/20 focus:ring-2"
                      )}
                      placeholder="6-digit PIN code"
                    />
                  </div>
                  {errors.pincode && (
                    <span className="mt-1.5 block text-xs text-red-500 font-medium">{errors.pincode}</span>
                  )}
                </label>

                <label className="block text-sm">
                  <span className="text-muted font-medium">Phone number</span>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      onBlur={(e) => handleBlur("phone", e.target.value)}
                      className={cn(
                        "w-full rounded-xl border bg-background pl-10 pr-4 h-11 text-sm text-foreground transition-all duration-200 outline-none",
                        errors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border/70 focus:border-[#C9A24B] focus:ring-[#C9A24B]/20 focus:ring-2"
                      )}
                      placeholder="Phone number"
                    />
                  </div>
                  {errors.phone && (
                    <span className="mt-1.5 block text-xs text-red-500 font-medium">{errors.phone}</span>
                  )}
                </label>
              </div>
            </div>
          </motion.section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 font-medium shadow-sm">
              {error}
            </div>
          )}
        </motion.div>

        {/* Right Column: Sticky Summary */}
        <aside className="relative">
          <div
            className={cn(
              "sticky top-24 rounded-2xl border border-border/80 bg-[#FAF8F5]/5 p-6 transition-all duration-300",
              isScrolled ? "shadow-xl border-border" : "shadow-md"
            )}
          >
            <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">Your order</h2>
            
            <ul className="mt-5 space-y-4 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {items.map((item) => (
                <li key={`${item.productId}-${item.sku}`} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0 text-muted">
                    <span className="line-clamp-2 text-foreground font-medium">{item.title}</span>
                    <span className="mt-1 block text-xs text-muted/70">Qty {item.quantity} · {formatPrice(item.price)} each</span>
                  </span>
                  <span className="shrink-0 font-semibold text-foreground">{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-border/75 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Shipping</span>
                {isFreeShipping ? (
                  <span className="text-emerald-600 font-semibold uppercase text-xs tracking-wider">Free Shipping</span>
                ) : (
                  <span className="font-semibold text-foreground">{formatPrice(shippingCost)}</span>
                )}
              </div>
              <div className="flex justify-between text-xs text-muted/60">
                <span>Estimated GST (18% included)</span>
                <span>{formatPrice(estGst)}</span>
              </div>

              <div className="border-t border-border pt-4 mt-2 flex justify-between items-baseline">
                <span className="text-base font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-foreground tracking-tight">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              className="mt-6 w-full h-12 rounded-xl bg-gradient-to-r from-[#4A5D3E] to-[#C9A24B] text-sm font-semibold text-white shadow-md hover:shadow-lg transition-shadow duration-300"
              disabled={loading || razorpayEnabled === null}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size="sm" className="border-white/30 border-t-white" /> Placing order…
                </span>
              ) : (
                paymentLabel
              )}
            </Button>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Secure checkout · Pay on delivery options supported</span>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
