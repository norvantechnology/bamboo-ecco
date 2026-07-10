"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCustomerUser } from "@/lib/auth";
import { TrackOrderForm } from "@/components/account/track-order-form";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loading";

export default function TrackOrderRedirectPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getCustomerUser()) {
      router.replace("/account/track");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return <PageLoader label="Loading…" />;
  }

  return (
    <div className="container-page max-w-lg py-10 sm:py-14">
      <h1 className="font-display text-2xl sm:text-3xl">Track your order</h1>
      <p className="mt-2 text-sm text-muted">Enter your order ID and email to see status and timeline.</p>
      <div className="mt-6 sm:mt-8">
        <TrackOrderForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Have an account?{" "}
        <Link href="/login?next=/account/track" className="text-secondary hover:underline">
          Sign in
        </Link>{" "}
        for a better experience.
      </p>
      <div className="mt-4 text-center">
        <Link href="/">
          <Button variant="outline" size="sm">← Back to shop</Button>
        </Link>
      </div>
    </div>
  );
}
