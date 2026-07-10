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

  const extraAnim =
    config.animation === "pulse"
      ? "announcement-pulse"
      : config.animation === "slide"
        ? "announcement-slide"
        : "";

  const htmlClass =
    "text-sm font-medium [&_a]:underline [&_a]:text-inherit [&_strong]:font-bold";

  const marqueeItems = (
    <>
      <div className={`announcement-marquee-item ${htmlClass}`} dangerouslySetInnerHTML={{ __html: config.html }} />
      <div
        className={`announcement-marquee-item ${htmlClass}`}
        aria-hidden
        dangerouslySetInnerHTML={{ __html: config.html }}
      />
    </>
  );

  return (
    <div
      className={`announcement-bar announcement-marquee relative overflow-hidden ${extraAnim}`}
      style={{ backgroundColor: config.backgroundColor, color: config.textColor }}
    >
      <div
        className={`container-page flex min-h-9 items-center gap-3 py-1.5 sm:min-h-11 sm:py-2.5 ${
          config.dismissible ? "pr-9 sm:pr-10" : ""
        }`}
      >
        <div className="announcement-marquee-track min-w-0 flex-1 overflow-hidden">
          <div className="announcement-marquee-inner">{marqueeItems}</div>
        </div>

        {config.dismissible && (
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-3 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full hover:bg-white/15"
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
