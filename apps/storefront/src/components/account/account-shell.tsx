"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearCustomerAuth,
  getCustomerToken,
  getCustomerUser,
  isCustomerAuthenticated,
  type AuthUser,
} from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AccountNav } from "@/components/account/account-nav";
import { PageLoader } from "@/components/ui/loading";
import { MotionFade } from "@/components/ui/motion";

export function AccountShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = getCustomerUser();
    const token = getCustomerToken();

    // Stale/partial session (user without token) — clear and send to login
    if (!current || !token) {
      clearCustomerAuth();
      router.replace(`/login?next=${encodeURIComponent(pathname || "/account")}`);
      return;
    }

    setUser(current);
    setReady(true);
  }, [router, pathname]);

  function logout() {
    clearCustomerAuth();
    router.push("/");
  }

  if (!ready || !user || !isCustomerAuthenticated()) {
    return <PageLoader label="Loading your account…" />;
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "there";

  return (
    <div className="container-page py-5 sm:py-10">
      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="space-y-3.5 lg:sticky lg:top-24 lg:self-start lg:space-y-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted sm:text-xs">Account</p>
            <h1 className="mt-0.5 break-words font-sans text-xl font-bold tracking-tight sm:mt-1 sm:text-3xl">
              Hi, {displayName}
            </h1>
            <p className="mt-0.5 text-xs text-muted [overflow-wrap:anywhere] sm:mt-1 sm:text-sm">{user.email}</p>
          </div>
          <AccountNav />
          <Button variant="outline" onClick={logout} className="hidden w-full lg:inline-flex">
            Sign out
          </Button>
        </aside>

        <div className="min-w-0">
          <MotionFade key={pathname} duration={180}>
            <div className="mb-4 flex items-start justify-between gap-3 lg:mb-6">
              <div className="min-w-0">
                {title && <h2 className="break-words font-numeric text-lg font-semibold sm:text-2xl">{title}</h2>}
                {subtitle && <p className="mt-0.5 text-xs text-muted sm:mt-1 sm:text-sm">{subtitle}</p>}
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="shrink-0 lg:hidden">
                Sign out
              </Button>
            </div>
            {children}
          </MotionFade>
        </div>
      </div>
    </div>
  );
}
