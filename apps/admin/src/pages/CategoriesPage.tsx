import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type AdminCategory,
  type CategoryPayload,
} from "../lib/api";
import { PageLoader } from "../components/Loading";
import { MotionFade } from "../components/ui/motion";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CategoryPayload & { id?: string }>({
    slug: "",
    name: "",
    imageUrl: "",
    parentId: null,
  });
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    getAdminCategories()
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const roots = categories.filter((c) => !c.parentId);
  const childrenByParent = categories.reduce<Record<string, AdminCategory[]>>((acc, cat) => {
    if (cat.parentId) {
      acc[cat.parentId] = acc[cat.parentId] ?? [];
      acc[cat.parentId].push(cat);
    }
    return acc;
  }, {});

  const parentOptions = roots.filter((c) => c._id !== form.id);

  function openCreate(parentId?: string | null) {
    setForm({ slug: "", name: "", imageUrl: "", parentId: parentId ?? null });
    setFormOpen(true);
  }

  function openEdit(cat: AdminCategory) {
    setForm({
      id: cat._id,
      slug: cat.slug,
      name: cat.name,
      imageUrl: cat.imageUrl ?? "",
      parentId: cat.parentId ?? null,
    });
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload: CategoryPayload = {
        slug: form.slug,
        name: form.name,
        imageUrl: form.imageUrl || undefined,
        parentId: form.parentId || null,
      };
      if (form.id) {
        await updateCategory(form.id, payload);
      } else {
        await createCategory(payload);
      }
      setFormOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) return <PageLoader label="Loading categories…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Categories</h1>
          <p className="text-sm text-muted">
            {categories.length} total · {roots.length} top-level · {categories.length - roots.length} sub-categories
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openCreate(null)}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-surface"
          >
            <Plus className="h-4 w-4" />
            Add category
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {formOpen && (
        <MotionFade>
          <form onSubmit={handleSave} className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-semibold">
              {form.id ? "Edit category" : form.parentId ? "New sub-category" : "New category"}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-muted">Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                      slug: form.id ? form.slug : slugify(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Slug</span>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-muted">Parent category</span>
                <select
                  value={form.parentId ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, parentId: e.target.value ? e.target.value : null })
                  }
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                >
                  <option value="">None (top-level category)</option>
                  {parentOptions.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="col-span-full block text-sm">
                <span className="text-muted">Image URL</span>
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                />
              </label>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-surface disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </MotionFade>
      )}

      <div className="space-y-4">
        {roots.map((root) => (
          <div key={root._id} className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <h3 className="font-semibold">{root.name}</h3>
                <p className="text-sm text-muted">/category/{root.slug}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => openCreate(root._id)}
                  className="rounded px-2 py-1 text-xs font-medium text-secondary hover:bg-background"
                >
                  + Sub-category
                </button>
                <button type="button" onClick={() => openEdit(root)} className="rounded p-1 hover:bg-background" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(root._id)}
                  className="rounded p-1 text-red-600 hover:bg-red-50"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {(childrenByParent[root._id] ?? []).length > 0 && (
              <ul className="border-t border-border bg-background/50">
                {(childrenByParent[root._id] ?? []).map((child) => (
                  <li
                    key={child._id}
                    className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:pl-8"
                  >
                    <div>
                      <p className="font-medium">{child.name}</p>
                      <p className="text-xs text-muted">/category/{child.slug}</p>
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openEdit(child)} className="rounded p-1 hover:bg-surface" aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(child._id)}
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
