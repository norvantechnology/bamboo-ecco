import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Star, Sparkles, CheckSquare, Square, X } from "lucide-react";
import {
  getAdminProducts,
  getAdminCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  formatInr,
  type AdminProduct,
  type AdminCategory,
  type ProductPayload,
} from "../lib/api";
import { PageLoader } from "../components/Loading";
import { ImageUpload } from "../components/ImageUpload";
import { MotionFade } from "../components/ui/motion";

const emptyForm = (): ProductPayload & { id?: string } => ({
  categoryId: "",
  slug: "",
  title: "",
  description: "",
  status: "active",
  isFeatured: false,
  isNewArrival: false,
  images: [],
  variants: [{ sku: "", price: 0, currency: "INR", stockQty: 0 }],
  faqs: [],
  specs: {
    material: "",
    dimensions: "",
    weight: "",
    careInstructions: "",
    shippingInfo: "",
    warranty: "",
  },
});

export function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([getAdminProducts(), getAdminCategories()])
      .then(([p, c]) => {
        setProducts(p);
        setCategories(c);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm({ ...emptyForm(), categoryId: categories[0]?._id ?? "" });
    setFormOpen(true);
  }

  function openEdit(product: AdminProduct) {
    const variant = product.variants[0];
    setForm({
      id: product._id,
      categoryId: product.categoryId ?? categories[0]?._id ?? "",
      slug: product.slug,
      title: product.title,
      description: product.description ?? "",
      status: product.status,
      isFeatured: product.isFeatured ?? false,
      isNewArrival: product.isNewArrival ?? false,
      images: (product.images ?? []).map((img) => ({
        url: img.url,
        alt: img.alt || "",
        sortOrder: img.sortOrder ?? 0,
        type: img.type || "product",
      })),
      variants: variant
        ? [{ sku: variant.sku, price: variant.price, currency: variant.currency || "INR", stockQty: variant.stockQty }]
        : [{ sku: "", price: 0, currency: "INR", stockQty: 0 }],
      faqs: (product.faqs ?? []).map((f: { question: string; answer: string; sortOrder?: number }) => ({ question: f.question, answer: f.answer, sortOrder: f.sortOrder ?? 0 })),
      specs: {
        material: product.specs?.material ?? "",
        dimensions: product.specs?.dimensions ?? "",
        weight: product.specs?.weight ?? "",
        careInstructions: product.specs?.careInstructions ?? "",
        shippingInfo: product.specs?.shippingInfo ?? "",
        warranty: product.specs?.warranty ?? "",
      },
    });
    setFormOpen(true);
  }

  async function toggleFlag(product: AdminProduct, flag: "isFeatured" | "isNewArrival") {
    try {
      await updateProduct(product._id, {
        categoryId: product.categoryId ?? categories[0]?._id ?? "",
        slug: product.slug,
        title: product.title,
        status: product.status,
        isFeatured: flag === "isFeatured" ? !product.isFeatured : product.isFeatured,
        isNewArrival: flag === "isNewArrival" ? !product.isNewArrival : product.isNewArrival,
        images: product.images,
        variants: product.variants,
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function setStatus(product: AdminProduct, status: string) {
    try {
      await updateProduct(product._id, {
        categoryId: product.categoryId ?? categories[0]?._id ?? "",
        slug: product.slug,
        title: product.title,
        description: product.description,
        status,
        isFeatured: product.isFeatured,
        isNewArrival: product.isNewArrival,
        images: product.images,
        variants: product.variants,
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    }
  }

  // ─── BULK SELECTION HANDLERS ────────────────────────────────────────────────
  function toggleSelectAll() {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p._id));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleBulkFlag(flag: "isFeatured" | "isNewArrival", value: boolean) {
    if (selectedIds.length === 0) return;
    setBulkUpdating(true);
    setError("");
    try {
      const selectedProducts = products.filter((p) => selectedIds.includes(p._id));
      await Promise.all(
        selectedProducts.map((product) =>
          updateProduct(product._id, {
            categoryId: product.categoryId ?? categories[0]?._id ?? "",
            slug: product.slug,
            title: product.title,
            description: product.description,
            status: product.status,
            isFeatured: flag === "isFeatured" ? value : (product.isFeatured ?? false),
            isNewArrival: flag === "isNewArrival" ? value : (product.isNewArrival ?? false),
            images: product.images,
            variants: product.variants,
          })
        )
      );
      setSelectedIds([]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk update failed");
    } finally {
      setBulkUpdating(false);
    }
  }

  async function handleBulkStatus(status: string) {
    if (selectedIds.length === 0) return;
    setBulkUpdating(true);
    setError("");
    try {
      const selectedProducts = products.filter((p) => selectedIds.includes(p._id));
      await Promise.all(
        selectedProducts.map((product) =>
          updateProduct(product._id, {
            categoryId: product.categoryId ?? categories[0]?._id ?? "",
            slug: product.slug,
            title: product.title,
            description: product.description,
            status,
            isFeatured: product.isFeatured ?? false,
            isNewArrival: product.isNewArrival ?? false,
            images: product.images,
            variants: product.variants,
          })
        )
      );
      setSelectedIds([]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk status update failed");
    } finally {
      setBulkUpdating(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected products?`)) return;
    setBulkUpdating(true);
    setError("");
    try {
      await Promise.all(selectedIds.map((id) => deleteProduct(id)));
      setSelectedIds([]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk delete failed");
    } finally {
      setBulkUpdating(false);
    }
  }

  function statusBadge(status: string) {
    const key = status === "archived" ? "hidden" : status;
    const styles: Record<string, string> = {
      active: "bg-green-50 text-green-800 dark:bg-green-900/40 dark:text-green-300",
      out_of_stock: "bg-amber-50 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300",
      draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      hidden: "bg-red-50 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    };
    const labels: Record<string, string> = {
      active: "Active",
      out_of_stock: "Out of stock",
      draft: "Draft",
      hidden: "Hidden",
    };
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[key] ?? "bg-background text-muted"}`}>
        {labels[key] ?? status}
      </span>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (form.id) {
        await updateProduct(form.id, form);
      } else {
        await createProduct(form);
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
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) return <PageLoader label="Loading products…" />;

  const isAllSelected = selectedIds.length > 0 && selectedIds.length === products.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Products</h1>
          <p className="text-sm text-muted">{products.length} products</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-surface"
        >
          <Plus className="h-4 w-4" />
          Add product
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/30 dark:text-red-300">{error}</div>
      )}

      {/* BULK ACTIONS TOOLBAR */}
      {selectedIds.length > 0 && (
        <MotionFade>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-surface">
                {selectedIds.length}
              </span>
              <span>products selected</span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="ml-2 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={bulkUpdating}
                onClick={() => handleBulkFlag("isFeatured", true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-300"
              >
                <Star className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
                Add Best Seller
              </button>
              <button
                type="button"
                disabled={bulkUpdating}
                onClick={() => handleBulkFlag("isFeatured", false)}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium hover:bg-background disabled:opacity-50"
              >
                Remove Best Seller
              </button>

              <div className="h-4 w-[1px] bg-border" />

              <button
                type="button"
                disabled={bulkUpdating}
                onClick={() => handleBulkFlag("isNewArrival", true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-100 disabled:opacity-50 dark:border-green-700/50 dark:bg-green-900/30 dark:text-green-300"
              >
                <Sparkles className="h-3.5 w-3.5 text-green-600 fill-green-500" />
                Add New Arrival
              </button>
              <button
                type="button"
                disabled={bulkUpdating}
                onClick={() => handleBulkFlag("isNewArrival", false)}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium hover:bg-background disabled:opacity-50"
              >
                Remove New Arrival
              </button>

              <div className="h-4 w-[1px] bg-border" />

              <select
                disabled={bulkUpdating}
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatus(e.target.value);
                    e.target.value = "";
                  }
                }}
                defaultValue=""
                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium"
              >
                <option value="" disabled>Change status…</option>
                <option value="active">Set Active</option>
                <option value="out_of_stock">Set Out of stock</option>
                <option value="draft">Set Draft</option>
                <option value="hidden">Set Hidden</option>
              </select>

              <button
                type="button"
                disabled={bulkUpdating}
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-800/40 dark:bg-red-900/30 dark:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected
              </button>
            </div>
          </div>
        </MotionFade>
      )}

      {formOpen && (
        <MotionFade>
          <form onSubmit={handleSave} className="rounded-xl border border-border bg-surface p-6">
            <h2 className="font-semibold">{form.id ? "Edit product" : "New product"}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-muted">Title</span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
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
              <label className="block text-sm">
                <span className="text-muted">Category</span>
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {categories
                    .filter((c) => !c.parentId)
                    .map((root) => {
                      const children = categories.filter((c) => c.parentId === root._id);
                      if (children.length === 0) {
                        return (
                          <option key={root._id} value={root._id}>
                            {root.name}
                          </option>
                        );
                      }
                      return (
                        <optgroup key={root._id} label={root.name}>
                          <option value={root._id}>{root.name} (all)</option>
                          {children.map((child) => (
                            <option key={child._id} value={child._id}>
                              {child.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                </select>
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-muted">Status</span>
                <select
                  value={form.status === "archived" ? "hidden" : form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                >
                  <option value="active">Active (in stock — shown in shop)</option>
                  <option value="out_of_stock">Out of stock (shown, cannot buy)</option>
                  <option value="draft">Draft (not shown on site)</option>
                  <option value="hidden">Hidden (not shown anywhere)</option>
                </select>
                <span className="mt-1 block text-xs text-muted">
                  Hidden and draft products are never returned by shop, search, homepage, or sitemap.
                </span>
              </label>
              <label className="block text-sm">
                <span className="text-muted">SKU</span>
                <input
                  required
                  value={form.variants[0]?.sku ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      variants: [{ ...form.variants[0], sku: e.target.value, price: form.variants[0]?.price ?? 0, stockQty: form.variants[0]?.stockQty ?? 0 }],
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Price (INR)</span>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.variants[0]?.price ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      variants: [{ ...form.variants[0], sku: form.variants[0]?.sku ?? "", price: Number(e.target.value), stockQty: form.variants[0]?.stockQty ?? 0 }],
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Stock</span>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.variants[0]?.stockQty ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      variants: [{ ...form.variants[0], sku: form.variants[0]?.sku ?? "", price: form.variants[0]?.price ?? 0, stockQty: Number(e.target.value) }],
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured ?? false}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                />
                <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                Best Seller (homepage)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isNewArrival ?? false}
                  onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
                />
                <Sparkles className="h-4 w-4 text-green-600 fill-green-500" />
                New Arrival (homepage)
              </label>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Product images</p>
                  <p className="text-xs text-muted">
                    Add several photos — customers can scroll through them on the product page.
                  </p>
                </div>
                <ImageUpload
                  folder="products"
                  alt={form.title || "Product"}
                  label="Add images"
                  multiple
                  onUploadedMany={(results) => {
                    const lifestyle = form.images?.filter((i) => i.type === "lifestyle") ?? [];
                    const existing = form.images?.filter((i) => i.type !== "lifestyle") ?? [];
                    const added = results.map((r, idx) => ({
                      url: r.url,
                      alt: form.title || "Product",
                      sortOrder: existing.length + idx,
                      type: "product" as const,
                    }));
                    setForm({
                      ...form,
                      images: [...existing, ...added, ...lifestyle],
                    });
                  }}
                />
              </div>

              {(form.images?.filter((i) => i.type !== "lifestyle").length ?? 0) > 0 ? (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {form.images
                    ?.filter((i) => i.type !== "lifestyle")
                    .map((img, index) => (
                      <li
                        key={`${img.url}-${index}`}
                        className="group relative overflow-hidden rounded-lg border border-border bg-background"
                      >
                        <img
                          src={img.url}
                          alt={img.alt || form.title}
                          className="aspect-square w-full object-contain p-2"
                        />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/55 px-2 py-1.5 text-xs text-white">
                          <span>#{index + 1}</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => {
                                const productImgs =
                                  form.images?.filter((i) => i.type !== "lifestyle") ?? [];
                                const lifestyle =
                                  form.images?.filter((i) => i.type === "lifestyle") ?? [];
                                if (index <= 0) return;
                                const next = [...productImgs];
                                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                                setForm({
                                  ...form,
                                  images: [
                                    ...next.map((im, i) => ({ ...im, sortOrder: i, type: "product" })),
                                    ...lifestyle,
                                  ],
                                });
                              }}
                              className="rounded bg-white/15 px-1.5 py-0.5 disabled:opacity-30"
                              title="Move earlier"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const productImgs =
                                  form.images?.filter((i) => i.type !== "lifestyle") ?? [];
                                const lifestyle =
                                  form.images?.filter((i) => i.type === "lifestyle") ?? [];
                                const next = productImgs.filter((_, i) => i !== index);
                                setForm({
                                  ...form,
                                  images: [
                                    ...next.map((im, i) => ({ ...im, sortOrder: i, type: "product" })),
                                    ...lifestyle,
                                  ],
                                });
                              }}
                              className="rounded bg-red-500/80 px-1.5 py-0.5"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted">
                  No product photos yet. Upload one or more images.
                </p>
              )}

              <input
                placeholder="Or paste an image URL and press Enter"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  const input = e.currentTarget;
                  const url = input.value.trim();
                  if (!url) return;
                  const lifestyle = form.images?.filter((i) => i.type === "lifestyle") ?? [];
                  const existing = form.images?.filter((i) => i.type !== "lifestyle") ?? [];
                  setForm({
                    ...form,
                    images: [
                      ...existing,
                      {
                        url,
                        alt: form.title || "Product",
                        sortOrder: existing.length,
                        type: "product",
                      },
                      ...lifestyle,
                    ],
                  });
                  input.value = "";
                }}
              />
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted">
                Lifestyle image (optional — shows in “In Real Homes” on homepage)
              </p>
              <ImageUpload
                folder="products/lifestyle"
                alt={`${form.title || "Product"} in a home`}
                label="Upload lifestyle photo"
                onUploaded={(r) => {
                  const productImgs = form.images?.filter((i) => i.type !== "lifestyle") ?? [];
                  setForm({
                    ...form,
                    images: [
                      ...productImgs,
                      {
                        url: r.url,
                        alt: `${form.title || "Product"} in a home`,
                        sortOrder: productImgs.length,
                        type: "lifestyle",
                      },
                    ],
                  });
                }}
              />
              <input
                placeholder="Lifestyle image URL"
                value={form.images?.find((i) => i.type === "lifestyle")?.url ?? ""}
                onChange={(e) => {
                  const productImgs = form.images?.filter((i) => i.type !== "lifestyle") ?? [];
                  const images = [...productImgs];
                  if (e.target.value) {
                    images.push({
                      url: e.target.value,
                      alt: `${form.title || "Product"} in a home`,
                      sortOrder: productImgs.length,
                      type: "lifestyle",
                    });
                  }
                  setForm({ ...form, images });
                }}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>

            {/* Product Specifications Section */}
            <div className="mt-6 space-y-3 rounded-lg border border-border p-4">
              <h4 className="text-sm font-semibold text-foreground">Product Specifications</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted">Material</label>
                  <input
                    type="text"
                    placeholder="Natural bamboo / rattan, handwoven"
                    value={form.specs?.material ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        specs: { ...(form.specs ?? {}), material: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Dimensions</label>
                  <input
                    type="text"
                    placeholder="35 cm x 35 cm x 45 cm"
                    value={form.specs?.dimensions ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        specs: { ...(form.specs ?? {}), dimensions: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Weight</label>
                  <input
                    type="text"
                    placeholder="1.2 kg"
                    value={form.specs?.weight ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        specs: { ...(form.specs ?? {}), weight: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Warranty</label>
                  <input
                    type="text"
                    placeholder="1 year artisan craft warranty"
                    value={form.specs?.warranty ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        specs: { ...(form.specs ?? {}), warranty: e.target.value },
                      })
                    }
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Care Instructions</label>
                <input
                  type="text"
                  placeholder="Wipe with soft dry cloth; keep away from excessive moisture"
                  value={form.specs?.careInstructions ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      specs: { ...(form.specs ?? {}), careInstructions: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Product FAQs Section */}
            <div className="mt-6 space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Product FAQs</h4>
                <button
                  type="button"
                  onClick={() => {
                    const current = form.faqs ?? [];
                    setForm({
                      ...form,
                      faqs: [...current, { question: "", answer: "", sortOrder: current.length }],
                    });
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add FAQ
                </button>
              </div>

              {(!form.faqs || form.faqs.length === 0) && (
                <p className="text-xs text-muted">No FAQs added yet. Click &quot;Add FAQ&quot; to create product-specific questions and answers.</p>
              )}

              {(form.faqs ?? []).map((faq, index) => (
                <div key={index} className="relative space-y-2 rounded-lg border border-border bg-background p-3">
                  <button
                    type="button"
                    onClick={() => {
                      const next = (form.faqs ?? []).filter((_, i) => i !== index);
                      setForm({ ...form, faqs: next });
                    }}
                    className="absolute right-2 top-2 text-xs text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Question #{index + 1}</label>
                    <input
                      type="text"
                      placeholder="Is bulb included?"
                      value={faq.question}
                      onChange={(e) => {
                        const next = [...(form.faqs ?? [])];
                        next[index] = { ...next[index], question: e.target.value };
                        setForm({ ...form, faqs: next });
                      }}
                      className="w-full rounded-md border border-border px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted">Answer</label>
                    <textarea
                      rows={2}
                      placeholder="Standard E27 holder included. Bulb sold separately."
                      value={faq.answer}
                      onChange={(e) => {
                        const next = [...(form.faqs ?? [])];
                        next[index] = { ...next[index], answer: e.target.value };
                        setForm({ ...form, faqs: next });
                      }}
                      className="w-full rounded-md border border-border px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
              ))}
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

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="w-10 px-4 py-3">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center text-muted hover:text-foreground"
                  title={isAllSelected ? "Deselect all" : "Select all"}
                >
                  {isAllSelected ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Flags</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const variant = product.variants[0];
              const isSelected = selectedIds.includes(product._id);
              return (
                <tr
                  key={product._id}
                  className={`border-b border-border last:border-0 transition-colors ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="w-10 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSelect(product._id)}
                      className="flex items-center text-muted hover:text-foreground"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium">{product.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        title="Toggle Best Seller"
                        onClick={() => toggleFlag(product, "isFeatured")}
                        className={`rounded p-1 transition-colors ${
                          product.isFeatured
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                            : "text-muted hover:bg-background"
                        }`}
                      >
                        <Star className={`h-4 w-4 ${product.isFeatured ? "fill-amber-400" : ""}`} />
                      </button>
                      <button
                        type="button"
                        title="Toggle New Arrival"
                        onClick={() => toggleFlag(product, "isNewArrival")}
                        className={`rounded p-1 transition-colors ${
                          product.isNewArrival
                            ? "bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                            : "text-muted hover:bg-background"
                        }`}
                      >
                        <Sparkles className={`h-4 w-4 ${product.isNewArrival ? "fill-green-500" : ""}`} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{variant?.sku ?? "—"}</td>
                  <td className="px-4 py-3">{variant ? formatInr(variant.price) : "—"}</td>
                  <td className="px-4 py-3">{variant?.stockQty ?? 0}</td>
                  <td className="px-4 py-3">{statusBadge(product.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label={`Status for ${product.title}`}
                        value={product.status === "archived" ? "hidden" : product.status}
                        onChange={(e) => setStatus(product, e.target.value)}
                        className="max-w-[140px] rounded-lg border border-border bg-background px-2 py-1 text-xs"
                      >
                        <option value="active">Active</option>
                        <option value="out_of_stock">Out of stock</option>
                        <option value="draft">Draft</option>
                        <option value="hidden">Hidden</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="rounded p-1 hover:bg-background"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product._id)}
                        className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
