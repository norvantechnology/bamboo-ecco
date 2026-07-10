import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  getAdminReviews,
  getAdminProducts,
  createReview,
  updateReview,
  deleteReview,
  updateReviewStatus,
  type AdminReview,
  type AdminProduct,
} from "../lib/api";

const emptyForm = {
  productId: "",
  reviewerName: "",
  rating: 5,
  body: "",
  photoUrl: "",
  status: "approved" as "pending" | "approved" | "rejected",
};

function productTitle(review: AdminReview) {
  const product = review.productId;
  if (!product) return "Product";
  if (typeof product === "string") return "Product";
  return product.title;
}

function productId(review: AdminReview) {
  const product = review.productId;
  if (!product) return "";
  if (typeof product === "string") return product;
  return product._id ?? "";
}

interface ReviewManagerProps {
  title?: string;
  description?: string;
  defaultFilter?: string;
}

export function ReviewManager({
  title = "Reviews",
  description = "Approved reviews appear in the “What Our Customers Say” section on the homepage.",
  defaultFilter = "approved",
}: ReviewManagerProps) {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [filter, setFilter] = useState(defaultFilter);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminReview | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  function load() {
    getAdminReviews(filter || undefined)
      .then(setReviews)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  useEffect(() => {
    load();
  }, [filter]);

  useEffect(() => {
    getAdminProducts()
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(review: AdminReview) {
    setEditing(review);
    setForm({
      productId: productId(review),
      reviewerName: review.reviewerName,
      rating: review.rating,
      body: review.body,
      photoUrl: review.photos?.[0] ?? "",
      status: review.status as typeof form.status,
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      productId: form.productId,
      reviewerName: form.reviewerName,
      rating: form.rating,
      body: form.body,
      photos: form.photoUrl ? [form.photoUrl] : [],
      status: form.status,
    };
    try {
      if (editing) {
        await updateReview(editing._id, payload);
      } else {
        await createReview(payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function handleStatus(id: string, status: "approved" | "rejected" | "pending") {
    await updateReviewStatus(id, status);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review?")) return;
    await deleteReview(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {(title || description) && (
          <div>
            {title && <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>}
            {description && <p className="text-sm text-muted">{description}</p>}
          </div>
        )}
        <div className={`flex flex-wrap items-center gap-2 ${!title && !description ? "w-full justify-end" : ""}`}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="approved">Approved (homepage)</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-surface"
          >
            <Plus className="h-4 w-4" />
            Add review
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit review" : "New review"}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="text-muted">Product</span>
              <select
                required
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-muted">Customer name</span>
              <input
                required
                value={form.reviewerName}
                onChange={(e) => setForm({ ...form, reviewerName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                placeholder="Meera S."
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Rating</span>
              <select
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} stars
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-muted">Review text</span>
              <textarea
                required
                rows={3}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                placeholder="What the customer said…"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="text-muted">Photo URL (optional avatar)</span>
              <input
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                placeholder="https://…"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              >
                <option value="approved">Approved — show on homepage</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-surface">
              {editing ? "Update" : "Create"}
            </button>
            <button type="button" onClick={resetForm} className="rounded-lg border border-border px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="rounded-xl border border-border bg-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{review.reviewerName}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      review.status === "approved"
                        ? "bg-green-50 text-green-800"
                        : review.status === "pending"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {review.status}
                  </span>
                </div>
                <p className="text-sm text-muted">
                  {productTitle(review)} · {"★".repeat(review.rating)}
                </p>
                <p className="mt-2 text-sm">&ldquo;{review.body}&rdquo;</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(review)}
                  className="rounded-lg border border-border p-2 hover:bg-background"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(review._id)}
                  className="rounded-lg border border-border p-2 text-red-600 hover:bg-red-50"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {review.status !== "approved" && (
                  <button
                    type="button"
                    onClick={() => handleStatus(review._id, "approved")}
                    className="rounded-lg bg-green-700 px-3 py-1.5 text-sm text-white"
                  >
                    Approve
                  </button>
                )}
                {review.status !== "rejected" && (
                  <button
                    type="button"
                    onClick={() => handleStatus(review._id, "rejected")}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-muted">
            No reviews found. Add a review above or switch the filter to see approved homepage reviews.
          </p>
        )}
      </div>
    </div>
  );
}
