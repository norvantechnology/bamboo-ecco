"use client";

import { useEffect } from "react";
import type { GoogleCustomerReviewsConfig } from "@/lib/api";

type ProductItem = {
  sku?: string;
  gtin?: string;
};

type Props = {
  config?: GoogleCustomerReviewsConfig;
  orderId: string;
  email?: string;
  createdAt?: string | Date;
  products?: ProductItem[];
};

declare global {
  interface Window {
    renderOptIn?: () => void;
    gapi?: {
      load: (name: string, callback: () => void) => void;
      surveyoptin: {
        render: (params: Record<string, unknown>) => void;
      };
    };
  }
}

export function GoogleReviewsOptIn({
  config,
  orderId,
  email,
  createdAt,
  products = [],
}: Props) {
  useEffect(() => {
    if (!config?.enabled || !config?.merchantId || !orderId || !email) {
      return;
    }

    const merchantId = parseInt(config.merchantId.trim(), 10) || 5827864300;
    const days = config.estimatedDeliveryDays || 5;

    // Calculate estimated delivery date: order createdAt + days
    const baseDate = createdAt ? new Date(createdAt) : new Date();
    const estDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
    const dateStr = estDate.toISOString().split("T")[0]; // YYYY-MM-DD

    const country = config.deliveryCountry || "IN";

    // Format products array if SKUs / GTINs exist
    const gtinList = products
      .map((p) => p.gtin || p.sku)
      .filter(Boolean)
      .map((gtin) => ({ gtin }));

    // Inject custom backdrop styling for Google Opt-in Modal
    const styleId = "gcr-custom-backdrop-style";
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.innerHTML = `
        div[id^="gapi_surveyoptin"] {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4) !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          border: 1px solid rgba(201, 169, 106, 0.3) !important;
        }
        iframe[src*="apis.google.com/u/0/se/"] {
          border-radius: 16px !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    window.renderOptIn = function () {
      if (window.gapi?.load) {
        window.gapi.load("surveyoptin", function () {
          if (window.gapi?.surveyoptin?.render) {
            try {
              const params: Record<string, unknown> = {
                merchant_id: merchantId,
                order_id: orderId,
                email: email.trim(),
                delivery_country: country,
                estimated_delivery_date: dateStr,
              };
              if (gtinList.length > 0) {
                params.products = gtinList;
              }
              window.gapi.surveyoptin.render(params);
            } catch {
              /* ignore duplicate survey renders */
            }
          }
        });
      }
    };

    const scriptId = "googleReviewsOptInScript";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://apis.google.com/js/platform.js?onload=renderOptIn";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    } else if (window.renderOptIn) {
      window.renderOptIn();
    }
  }, [config, orderId, email, createdAt, products]);

  return null;
}
