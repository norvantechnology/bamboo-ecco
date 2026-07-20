"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { customerLogin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

    const isEmailValid = validateField("email", email);
    const isPasswordValid = validateField("password", password);

    if (!isEmailValid || !isPasswordValid) {
      setError("Please check details in required fields.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await customerLogin(email, password);
      const { setCustomerAuth } = await import("@/lib/auth");
      setCustomerAuth(res);
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/account");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

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
            <h2 className="mt-6 font-display text-2xl font-semibold text-foreground">Signed In Successfully!</h2>
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
          <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">Sign in</h1>
          
          <label className="block text-sm">
            <span className="text-muted font-medium">Email address</span>
            <div className="relative mt-1.5">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
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
            <div className="flex items-center justify-between">
              <span className="text-muted font-medium">Password</span>
              <Link href="/forgot-password" className="text-xs font-semibold text-[#C9A24B] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) validateField("password", e.target.value);
                }}
                onBlur={(e) => handleBlur("password", e.target.value)}
                className={cn(
                  "w-full rounded-xl border bg-background pl-10 pr-10 h-11 text-sm text-foreground transition-all duration-200 outline-none",
                  "focus:ring-2 focus:ring-[#C9A24B]/20 [&:-webkit-autofill]:[box-shadow:0_0_0_1000px_var(--bg)_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:var(--brand-text)]",
                  errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-border/70 focus:border-[#C9A24B]"
                )}
                placeholder="••••••••"
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
                <Spinner size="sm" className="border-white/30 border-t-white" /> Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </Button>

          <p className="text-center text-sm text-muted mt-4">
            No account?{" "}
            <Link href="/register" className="text-[#C9A24B] font-semibold hover:underline">
              Register
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
