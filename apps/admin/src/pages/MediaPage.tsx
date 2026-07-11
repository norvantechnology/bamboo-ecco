import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getAdminGallery, createGalleryItem, deleteGalleryItem, getMediaConfig, type AdminGalleryItem } from "../lib/api";
import { ImageUpload } from "../components/ImageUpload";

export function MediaPage() {
  const [items, setItems] = useState<AdminGalleryItem[]>([]);
  const [error, setError] = useState("");
  const [cloudinaryReady, setCloudinaryReady] = useState<boolean | null>(null);
  const [form, setForm] = useState({ imageUrl: "", caption: "", instagramUrl: "" });

  function load() {
    getAdminGallery()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  useEffect(() => {
    load();
    getMediaConfig()
      .then((c) => setCloudinaryReady(c.configured))
      .catch(() => setCloudinaryReady(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createGalleryItem({ ...form, sortOrder: items.length });
      setForm({ imageUrl: "", caption: "", instagramUrl: "" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">Media Library</h1>
        <p className="text-sm text-muted">Instagram gallery (“Follow Our Journey”) — upload images via Cloudinary</p>
      </div>

      {cloudinaryReady === false && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Cloudinary is not configured. Add <code className="font-mono">CLOUDINARY_*</code> keys to <code className="font-mono">.env</code> and restart the API. You can still paste image URLs manually.
        </div>
      )}

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleAdd} className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <h2 className="font-semibold">Add image</h2>

        {cloudinaryReady && (
          <ImageUpload
            folder="gallery"
            alt={form.caption || "Bamboo Eco-Hub gallery"}
            caption={form.caption}
            slug={form.caption ? form.caption.toLowerCase().replace(/\s+/g, "-") : undefined}
            onUploaded={(r) => setForm((f) => ({ ...f, imageUrl: r.url }))}
          />
        )}

        <input
          required
          placeholder="Image URL (from upload or paste)"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          placeholder="Caption (used for alt text & SEO)"
          value={form.caption}
          onChange={(e) => setForm({ ...form, caption: e.target.value })}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
        <input
          placeholder="Instagram URL (optional)"
          value={form.instagramUrl}
          onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
        <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-surface">
          <Plus className="h-4 w-4" /> Add to gallery
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item._id} className="rounded-xl border border-border bg-surface overflow-hidden">
            <img src={item.imageUrl} alt={item.caption || "Gallery image"} className="aspect-square w-full object-cover" loading="lazy" />
            <div className="flex items-center justify-between p-3">
              <p className="text-xs text-muted truncate">{item.caption || "—"}</p>
              <button type="button" onClick={() => deleteGalleryItem(item._id).then(load)}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
