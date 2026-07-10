"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearCustomerAuth, getCustomerUser, type AuthUser } from "@/lib/auth";
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
    if (!current) {
      router.replace("/login?next=/account");
      return;
    }
    setUser(current);
    setReady(true);
  }, [router]);

  function logout() {
    clearCustomerAuth();
    router.push("/");
  }

  if (!ready || !user) {
    return <PageLoader label="Loading your account…" />;
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "there";

  return (
    <div className="container-page py-6 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Account</p>
            <h1 className="mt-1 font-sans text-2xl font-bold tracking-tight sm:text-3xl">Hi, {displayName}</h1>
            <p className="mt-1 text-sm text-muted [overflow-wrap:anywhere]">{user.email}</p>
          </div>
          <AccountNav />
          <Button variant="outline" onClick={logout} className="hidden w-full lg:inline-flex">
            Sign out
          </Button>
        </aside>

        <div className="min-w-0">
          <MotionFade key={pathname} duration={180}>
            <div className="mb-5 flex items-start justify-between gap-4 lg:mb-6">
              <div className="min-w-0">
                {title && <h2 className="font-numeric text-xl font-semibold sm:text-2xl">{title}</h2>}
                {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
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
