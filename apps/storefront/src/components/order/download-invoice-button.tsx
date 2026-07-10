"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { downloadAccountOrderInvoice, downloadGuestOrderInvoice } from "@/lib/invoice";
import { getCustomerToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/loading";

type DownloadInvoiceButtonProps = {
  orderId: string;
  email?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
  label?: string;
  className?: string;
};

export function DownloadInvoiceButton({
  orderId,
  email,
  variant = "outline",
  size = "default",
  label = "Download invoice",
  className,
}: DownloadInvoiceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setLoading(true);
    setError("");
    try {
      const token = getCustomerToken();
      if (token) {
        await downloadAccountOrderInvoice(orderId, token);
        return;
      }

      let guestEmail = email?.trim();
      if (!guestEmail) {
        guestEmail = window.prompt("Enter the email used at checkout")?.trim() ?? "";
      }
      if (!guestEmail) return;

      await downloadGuestOrderInvoice(orderId, guestEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void handleDownload();
        }}
        disabled={loading}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Spinner size="sm" />
            Preparing…
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            {label}
          </span>
        )}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
