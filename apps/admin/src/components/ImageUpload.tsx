"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { uploadMedia } from "../lib/api";

interface Props {
  folder?: string;
  alt?: string;
  caption?: string;
  slug?: string;
  onUploaded: (result: { url: string; publicId: string; alt?: string }) => void;
  label?: string;
}

export function ImageUpload({ folder = "media", alt, caption, slug, onUploaded, label = "Upload image" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setLoading(true);
    setError("");
    try {
      const result = await uploadMedia(file, { folder, alt, caption, slug });
      onUploaded(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-background disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {loading ? "Uploading…" : label}
      </button>
      <p className="text-xs text-muted">JPEG, PNG, WebP, AVIF, GIF — max 10MB. Optimized via Cloudinary.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
