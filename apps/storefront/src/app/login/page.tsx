"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { customerLogin } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await customerLogin(email, password);
      const { setCustomerAuth } = await import("@/lib/auth");
      setCustomerAuth(res);
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-12">
      <form onSubmit={handleSubmit} className="data-card w-full max-w-md space-y-4 p-6 sm:p-8">
        <h1 className="font-display text-2xl">Sign in</h1>
        <label className="block text-sm">
          <span className="text-muted">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
        </label>
        <label className="block text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted">Password</span>
            <Link href="/forgot-password" className="text-xs text-muted hover:text-foreground">
              Forgot password?
            </Link>
          </div>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-center text-sm text-muted">
          No account?{" "}
          <Link href="/register" className="text-foreground hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
