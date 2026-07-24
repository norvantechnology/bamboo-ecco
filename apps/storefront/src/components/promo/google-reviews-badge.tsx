"use client";

import { useEffect, useState } from "react";
import type { GoogleCustomerReviewsConfig } from "@/lib/api";

type Props = {
  config?: GoogleCustomerReviewsConfig;
};

declare global {
  interface Window {
    merchantwidget?: {
      start: (options: { merchant_id: number | string; position?: string }) => void;
    };
  }
}

export function GoogleReviewsBadge({ config }: Props) {
  const [showTrustPill, setShowTrustPill] = useState(false);

  useEffect(() => {
    if (!config?.enabled || !config?.badgeEnabled || !config?.merchantId) {
      return;
    }

    const merchantId = config.merchantId.trim();
    if (!merchantId) return;

    setShowTrustPill(true);

    function initBadge() {
      if (window.merchantwidget) {
        try {
          window.merchantwidget.start({
            merchant_id: merchantId,
            position: config?.badgePosition || "BOTTOM_RIGHT",
          });
        } catch {
          /* ignore duplicate widget init */
        }
      }
    }

    const scriptId = "merchantWidgetScript";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://www.gstatic.com/shopping/merchant/merchantwidget.js";
      script.defer = true;
      script.onload = initBadge;
      document.body.appendChild(script);
    } else {
      initBadge();
    }
  }, [config]);

  if (!showTrustPill || !config?.badgeEnabled) return null;

  const isLeft = config?.badgePosition === "BOTTOM_LEFT";

  return (
    <div
      className={`fixed bottom-4 ${
        isLeft ? "left-4" : "right-4"
      } z-40 flex items-center gap-2.5 rounded-full bg-[#1C1A17]/90 px-4 py-2 text-xs text-[#FAF8F5] shadow-2xl backdrop-blur-md border border-[#3D3832] transition-all hover:scale-105 hover:border-[#C9A96A]`}
      style={{ willChange: "transform" }}
    >
      {/* Official Google G Logo */}
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>

      <div className="flex flex-col text-left">
        <span className="font-medium tracking-wide text-[#F0EDE6] text-[11px] leading-tight">
          Google Customer Reviews
        </span>
        <span className="flex items-center gap-1 text-[10px] text-[#C9A96A] font-semibold">
          ★★★★★ <span className="text-[#A39E94]">4.9 Verified</span>
        </span>
      </div>
    </div>
  );
}
