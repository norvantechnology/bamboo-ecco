"use client";

import { useEffect, useState } from "react";

export function BambooPreloader() {
  const [mounted, setMounted] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [destroyed, setDestroyed] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Only run on fresh page load/refresh, skip on subsequent soft client navigations
    try {
      if (sessionStorage.getItem("bamboo_preloaded_session")) {
        setDestroyed(true);
        return;
      }
    } catch {
      /* storage disabled */
    }

    setMounted(true);

    // Fast progress line fill
    const timer1 = setTimeout(() => setProgress(65), 250);
    const timer2 = setTimeout(() => setProgress(100), 650);

    // Smooth curtain fade out after 850ms
    const timer3 = setTimeout(() => {
      setHiding(true);
      try {
        sessionStorage.setItem("bamboo_preloaded_session", "1");
      } catch {
        /* storage disabled */
      }
    }, 850);

    // Unmount from DOM completely at 1400ms
    const timer4 = setTimeout(() => setDestroyed(true), 1400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  if (destroyed || !mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#181614] text-[#FAF8F5] transition-all duration-600 ease-in-out ${
        hiding ? "opacity-0 pointer-events-none scale-102" : "opacity-100"
      }`}
      style={{ willChange: "opacity, transform" }}
    >
      {/* Ambient background glow */}
      <div className="absolute h-72 w-72 rounded-full bg-gradient-to-br from-[#4A5D3E]/30 to-[#C9A24B]/20 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Animated Bamboo Icon */}
        <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#24211D] p-3 shadow-2xl border border-[#3D3832]">
          <svg
            className="h-10 w-10 text-[#5C6B52] animate-pulse"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Bamboo stalk & leaf paths */}
            <path d="M12 2v20M12 7h5a3 3 0 0 0 0-6M12 14h-5a3 3 0 0 1 0-6M12 19h4a2 2 0 0 0 0-4" />
            <circle cx="12" cy="7" r="1.2" fill="currentColor" />
            <circle cx="12" cy="14" r="1.2" fill="currentColor" />
          </svg>
        </div>

        {/* Brand Name */}
        <h1 className="font-display text-xl font-medium tracking-[0.25em] text-[#F0EDE6] uppercase sm:text-2xl">
          Bamboo Eco-Hub
        </h1>
        <p className="mt-1 text-[11px] tracking-[0.2em] text-[#A39E94] uppercase sm:text-xs">
          Handcrafted Natural Elegance
        </p>

        {/* Progress Bar Container */}
        <div className="mt-6 h-1 w-44 overflow-hidden rounded-full bg-[#2E2B26]">
          <div
            className="h-full bg-gradient-to-r from-[#5C6B52] via-[#C9A96A] to-[#8B5E34] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
