"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { customerRegister } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: "", color: "bg-transparent", width: "w-0", score: 0 };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "w-1/3", score };
    if (score === 2 || score === 3) return { label: "Medium", color: "bg-amber-500", width: "w-2/3", score };
    return { label: "Strong", color: "bg-emerald-500", width: "w-full", score };
  };

  const validateField = (field: string, value: string) => {
    let err = "";
    if (!value.trim()) {
      err = "This field is required";
    } else if (field === "email" && !/\S+@\S+\.\S+/.test(value)) {
      err = "Please enter a valid email address";
    } else if (field === "password" && value.length < 6) {
      err = "Password must be at least 6 characters";
    }
    setErrors((prev) => ({ ...prev, [field]: err }));
    return !err;
  };

  const handleBlur = (field: string, value: string) => {
    validateField(field, value);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const isFirstValid = validateField("firstName", form.firstName);
    const isLastValid = validateField("lastName", form.lastName);
    const isEmailValid = validateField("email", form.email);
    const isPasswordValid = validateField("password", form.password);

    if (!isFirstValid || !isLastValid || !isEmailValid || !isPasswordValid) {
      setError("Please check details in required fields.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await customerRegister(form);
      const { setCustomerAuth } = await import("@/lib/auth");
      setCustomerAuth(res);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/account");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  }

  const strength = getPasswordStrength(form.password);

  return (
    <div className="container-page flex min-h-[60dvh] items-center justify-center py-8 sm:py-12 relative">
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
            <h2 className="mt-6 font-display text-2xl font-semibold text-foreground">Account Created Successfully!</h2>
            <p className="mt-2 text-sm text-muted">Loading your customer dashboard...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md rounded-2xl border border-border/60 bg-[#FAF8F5]/5 p-6 sm:p-8 shadow-warm"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">Create account</h1>
          
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-muted font-medium">First name</span>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => {
                    setForm({ ...form, firstName: e.target.value });
                    if (errors.firstName) validateField("firstName", e.target.value);
                  }}
                  onBlur={(e) => handleBlur("firstName", e.target.value)}
                  className={cn(
                    "w-full rounded-xl border bg-background pl-10 pr-4 h-11 text-sm text-foreground transition-all duration-200 outline-none",
                    "focus:ring-2 focus:ring-[#C9A24B]/20 [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_var(--bg)_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:var(--brand-text)]",
                    errors.firstName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border/70 focus:border-[#C9A24B]"
                  )}
                  placeholder="First name"
                />
              </div>
              {errors.firstName && (
                <span className="mt-1.5 block text-xs text-red-500 font-medium">{errors.firstName}</span>
              )}
            </label>

            <label className="block text-sm">
              <span className="text-muted font-medium">Last name</span>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => {
                    setForm({ ...form, lastName: e.target.value });
                    if (errors.lastName) validateField("lastName", e.target.value);
                  }}
                  onBlur={(e) => handleBlur("lastName", e.target.value)}
                  className={cn(
                    "w-full rounded-xl border bg-background pl-10 pr-4 h-11 text-sm text-foreground transition-all duration-200 outline-none",
                    "focus:ring-2 focus:ring-[#C9A24B]/20 [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_var(--bg)_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:var(--brand-text)]",
                    errors.lastName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border/70 focus:border-[#C9A24B]"
                  )}
                  placeholder="Last name"
                />
              </div>
              {errors.lastName && (
                <span className="mt-1.5 block text-xs text-red-500 font-medium">{errors.lastName}</span>
              )}
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-muted font-medium">Email address</span>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) validateField("email", e.target.value);
                }}
                onBlur={(e) => handleBlur("email", e.target.value)}
                className={cn(
                  "w-full rounded-xl border bg-background pl-10 pr-4 h-11 text-sm text-foreground transition-all duration-200 outline-none",
                  "focus:ring-2 focus:ring-[#C9A24B]/20 [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_var(--bg)_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:var(--brand-text)]",
                  errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border/70 focus:border-[#C9A24B]"
                )}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <span className="mt-1.5 block text-xs text-red-500 font-medium">{errors.email}</span>
            )}
          </label>

          <label className="block text-sm">
            <span className="text-muted font-medium">Password</span>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
              <input
                required
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (errors.password) validateField("password", e.target.value);
                }}
                onBlur={(e) => handleBlur("password", e.target.value)}
                className={cn(
                  "w-full rounded-xl border bg-background pl-10 pr-10 h-11 text-sm text-foreground transition-all duration-200 outline-none",
                  "focus:ring-2 focus:ring-[#C9A24B]/20 [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_var(--bg)_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:var(--brand-text)]",
                  errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border/70 focus:border-[#C9A24B]"
                )}
                placeholder="Minimum 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted/50 hover:text-foreground/80 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <span className="mt-1.5 block text-xs text-red-500 font-medium">{errors.password}</span>
            )}

            {/* Password Strength Indicator */}
            {form.password && (
              <div className="mt-3 space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted/80">Strength</span>
                  <span
                    className="font-bold uppercase tracking-wider text-[9px]"
                    style={{
                      color:
                        strength.score <= 1
                          ? "#ef4444"
                          : strength.score < 4
                            ? "#f59e0b"
                            : "#10b981",
                    }}
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="h-1 w-full bg-border/40 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-300 rounded-full", strength.color, strength.width)}
                  />
                </div>
              </div>
            )}
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium shadow-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-[#4A5D3E] hover:bg-[#3D4D33] text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" className="border-white/30 border-t-white" /> Creating account…
              </span>
            ) : (
              "Create account"
            )}
          </Button>

          <p className="text-center text-sm text-muted mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-[#C9A24B] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
