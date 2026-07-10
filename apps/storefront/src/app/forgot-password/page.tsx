"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Password reset email flow — wire to API when SMTP is configured
    await new Promise((r) => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="icon-brand" /> Back to sign in
        </Link>

        <h1 className="mt-6 font-display text-3xl">Reset password</h1>
        <p className="mt-2 text-sm text-muted">
          Enter your email and we&apos;ll send a reset link if an account exists.
        </p>

        {sent ? (
          <div className="mt-8 rounded-lg border border-border bg-surface p-6 text-sm">
            <p className="font-medium text-foreground">Check your inbox</p>
            <p className="mt-2 text-muted">
              If {email} is registered, you&apos;ll receive reset instructions shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block text-sm">
              <span className="text-muted">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5"
              />
            </label>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
