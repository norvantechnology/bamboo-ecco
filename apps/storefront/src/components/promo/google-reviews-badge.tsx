"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    if (!config?.enabled || !config?.badgeEnabled || !config?.merchantId) {
      return;
    }

    const merchantId = config.merchantId.trim();
    if (!merchantId) return;

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

  return null;
}
