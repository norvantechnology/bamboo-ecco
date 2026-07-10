"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { AnnouncementBarConfig } from "@/lib/api";

const DISMISS_KEY = "terra-announcement-dismissed";

type AnnouncementBarProps = {
  config: AnnouncementBarConfig;
};

export function AnnouncementBar({ config }: AnnouncementBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!config.enabled || !config.html.trim()) return;
    if (config.dismissible && sessionStorage.getItem(DISMISS_KEY) === "1") return;
    setVisible(true);
  }, [config]);

  if (!visible) return null;

  function dismiss() {
    if (config.dismissible) sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  const isMarquee = config.animation === "marquee";
  const extraAnim =
    config.animation === "pulse"
      ? "announcement-pulse"
      : config.animation === "slide"
        ? "announcement-slide"
        : "";

  const htmlClass =
    "text-[11px] font-medium leading-none sm:text-sm sm:leading-snug [&_a]:underline [&_a]:text-inherit [&_strong]:font-bold";

  const marqueeMarkup = (
    <div className="announcement-marquee-track min-w-0 flex-1 overflow-hidden">
      <div className="announcement-marquee-inner">
        <div className={`announcement-marquee-item ${htmlClass}`} dangerouslySetInnerHTML={{ __html: config.html }} />
        <div
          className={`announcement-marquee-item ${htmlClass}`}
          aria-hidden
          dangerouslySetInnerHTML={{ __html: config.html }}
        />
      </div>
    </div>
  );

  return (
    <div
      className={`announcement-bar relative overflow-hidden ${extraAnim}`}
      style={{ backgroundColor: config.backgroundColor, color: config.textColor }}
    >
      {/* Mobile: always a small single-line scrolling marquee */}
      <div
        className={`announcement-marquee container-page flex min-h-7 items-center py-1 sm:hidden ${
          config.dismissible ? "pr-8" : ""
        }`}
      >
        {marqueeMarkup}
      </div>

      {/* Desktop: honors the configured animation */}
      <div
        className={`announcement-marquee container-page hidden min-h-11 items-center gap-3 py-2.5 sm:flex ${
          config.dismissible ? "pr-10" : ""
        }`}
      >
        {isMarquee ? (
          marqueeMarkup
        ) : (
          <div
            className={`min-w-0 flex-1 text-center ${htmlClass} line-clamp-1`}
            dangerouslySetInnerHTML={{ __html: config.html }}
          />
        )}
      </div>

      {config.dismissible && (
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-2 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full hover:bg-white/15 sm:right-3 sm:h-7 sm:w-7"
          aria-label="Dismiss announcement"
        >
          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      )}
    </div>
  );
}
