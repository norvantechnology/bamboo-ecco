"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { cn } from "@/lib/utils";

const BAR_HEIGHT = "calc(4.5rem + env(safe-area-inset-bottom))";

export function MobileCartBar() {
  const { count } = useCart();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const onCartPage = pathname === "/cart";
  const active = count > 0 && !onCartPage;

  useEffect(() => {
    if (active) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [active]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => {
      if (active && mq.matches) {
        document.body.style.paddingBottom = BAR_HEIGHT;
      } else {
        document.body.style.paddingBottom = "";
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.body.style.paddingBottom = "";
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-warm-lg backdrop-blur-lg transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] sm:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <Link
        href="/cart"
        className="motion-pop flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-secondary px-5 text-base font-semibold text-white hover:opacity-95"
      >
        <ShoppingBag className="h-5 w-5 shrink-0" />
        <span>View cart ({count})</span>
        <ArrowRight className="h-4 w-4 shrink-0 opacity-80" />
      </Link>
    </div>
  );
}
