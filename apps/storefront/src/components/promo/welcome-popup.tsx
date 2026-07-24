"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import type { WelcomePopupConfig } from "@/lib/api";

type WelcomePopupProps = {
  config: WelcomePopupConfig;
};

declare global {
  interface Window {
    closePopup?: () => void;
  }
}

/** Unique per full page load / refresh; stays the same during client-side navigations. */
function getDocumentNavId(): string {
  if (typeof performance !== "undefined" && typeof performance.timeOrigin === "number") {
    return String(performance.timeOrigin);
  }
  return "nav";
}

const SHOWN_KEY = "bamboo-welcome-popup-shown-nav";

function alreadyShownThisPageLoad(): boolean {
  try {
    return sessionStorage.getItem(SHOWN_KEY) === getDocumentNavId();
  } catch {
    return false;
  }
}

function markShownThisPageLoad(): void {
  try {
    sessionStorage.setItem(SHOWN_KEY, getDocumentNavId());
  } catch {
    /* private mode / blocked storage */
  }
}

export function WelcomePopup({ config }: WelcomePopupProps) {
  const [open, setOpen] = useState(false);
  const htmlRef = useRef<HTMLDivElement>(null);

  const closePopup = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!config.enabled) return;

    const hasContent =
      (config.mode === "html" && config.html.trim()) ||
      (config.mode === "image" && config.imageUrl.trim());
    if (!hasContent) return;

    // Only on real open / refresh — not when soft-navigating back to home
    if (alreadyShownThisPageLoad()) return;

    // Delay popup by 2.2s so page settles smoothly first
    const timer = setTimeout(() => {
      markShownThisPageLoad();
      setOpen(true);
    }, 2200);

    return () => clearTimeout(timer);
  }, [config]);

  useEffect(() => {
    if (!open) return;

    window.closePopup = closePopup;

    const container = htmlRef.current;
    function onContentClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-close-popup]")) {
        closePopup();
      }
    }

    container?.addEventListener("click", onContentClick);

    return () => {
      delete window.closePopup;
      container?.removeEventListener("click", onContentClick);
    };
  }, [open, closePopup]);

  // Lock background body scroll when popup is active
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !config.enabled) return null;

  const imageBlock = config.imageUrl ? (
    <Image
      src={config.imageUrl}
      alt="Welcome"
      width={640}
      height={480}
      className="h-auto w-full max-h-[70vh] object-contain"
    />
  ) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#1a1816]/70 backdrop-blur-sm"
        onClick={closePopup}
        aria-label="Close welcome popup"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Welcome"
        className="welcome-popup-panel relative z-[1] w-full max-w-lg overflow-hidden rounded-2xl bg-surface shadow-warm-lg"
      >
        <button
          type="button"
          onClick={closePopup}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          {config.mode === "image" ? (
            config.imageLink ? (
              <Link href={config.imageLink} onClick={closePopup}>
                {imageBlock}
              </Link>
            ) : (
              imageBlock
            )
          ) : (
            <div
              ref={htmlRef}
              className="prose prose-sm max-w-none text-foreground [&_a]:text-secondary [&_img]:max-w-full [&_img]:rounded-lg"
              dangerouslySetInnerHTML={{ __html: config.html }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
