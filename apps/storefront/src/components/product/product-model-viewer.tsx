"use client";

import { createElement, useEffect, useRef, useState } from "react";
import { Box, ImageIcon } from "lucide-react";

interface Model3d {
  glbUrl?: string;
  usdzUrl?: string;
  posterUrl?: string;
}

interface Props {
  model3d: Model3d;
  alt: string;
  fallbackImage?: string;
  showToggle?: boolean;
}

export function ProductModelViewer({ model3d, alt, fallbackImage, showToggle = true }: Props) {
  const [mode, setMode] = useState<"image" | "3d">("image");
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const viewerRef = useRef<HTMLElement>(null);

  const glbUrl = model3d.glbUrl;
  const poster = model3d.posterUrl || fallbackImage;

  useEffect(() => {
    if (mode !== "3d" || !glbUrl) return;
    let cancelled = false;
    import("@google/model-viewer").then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, glbUrl]);

  useEffect(() => {
    if (!ready || mode !== "3d" || !viewerRef.current) return;
    const viewer = viewerRef.current;
    const onLoad = () => setLoaded(true);
    viewer.addEventListener("load", onLoad);
    return () => viewer.removeEventListener("load", onLoad);
  }, [mode, glbUrl, ready]);

  if (!glbUrl) return null;

  return (
    <div className="space-y-3">
      {showToggle && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("image")}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
              mode === "image"
                ? "border-secondary bg-secondary text-white shadow-warm"
                : "border-border hover:bg-background"
            }`}
          >
            <ImageIcon className="icon-brand" />
            Photos
          </button>
          <button
            type="button"
            onClick={() => setMode("3d")}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
              mode === "3d"
                ? "border-secondary bg-secondary text-white shadow-warm"
                : "border-border hover:bg-background"
            }`}
          >
            <Box className="icon-brand" />
            View in 3D
          </button>
        </div>
      )}

      {mode === "image" && poster ? (
        <div className="relative aspect-square overflow-hidden rounded-lg bg-background">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={poster} alt={alt} className="h-full w-full object-contain object-center" loading="lazy" />
        </div>
      ) : null}

      {(mode === "3d" || !showToggle) && ready ? (
        <div
          className={`relative aspect-square overflow-hidden rounded-lg bg-background ${
            mode === "image" && showToggle ? "hidden" : ""
          }`}
        >
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted">
              Loading 3D model…
            </div>
          )}
          {createElement("model-viewer", {
            ref: viewerRef,
            src: glbUrl,
            "ios-src": model3d.usdzUrl,
            poster,
            alt,
            "camera-controls": true,
            "touch-action": "pan-y",
            "interaction-prompt": "auto",
            "shadow-intensity": "1",
            exposure: "1",
            ar: true,
            "ar-modes": "webxr scene-viewer quick-look",
            loading: "lazy",
            style: { width: "100%", height: "100%", background: "transparent" },
          })}
          <p className="absolute bottom-3 left-3 rounded-full bg-surface/90 px-3 py-1 text-xs text-muted backdrop-blur">
            Drag to rotate · Pinch to zoom
          </p>
        </div>
      ) : null}
    </div>
  );
}
