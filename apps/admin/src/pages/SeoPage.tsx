import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import {
  getAdminRedirects,
  createRedirect,
  deleteRedirect,
  type AdminRedirect,
} from "../lib/api";

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL || "http://localhost:3000";

const SEO_FILES = [
  { path: "/robots.txt", label: "Robots.txt" },
  { path: "/sitemap.xml", label: "Sitemap" },
  { path: "/llms.txt", label: "llms.txt" },
  { path: "/ai.txt", label: "ai.txt" },
];

export function SeoPage() {
  const [redirects, setRedirects] = useState<AdminRedirect[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fromPath: "", toPath: "", statusCode: 301 });
  const [saving, setSaving] = useState(false);

  function load() {
    getAdminRedirects()
      .then(setRedirects)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createRedirect(form);
      setForm({ fromPath: "", toPath: "", statusCode: 301 });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete redirect?")) return;
    await deleteRedirect(id);
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="URLs & SEO"
        description={
          <>
            Edit page text and keywords in{" "}
            <Link to="/homepage" className="font-medium text-secondary hover:underline">Homepage</Link>,{" "}
            <Link to="/content" className="font-medium text-secondary hover:underline">Site pages</Link>, and{" "}
            <Link to="/products" className="font-medium text-secondary hover:underline">Products</Link>.
            This page is for URL redirects and technical files only.
          </>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-sm">Storefront files</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SEO_FILES.map((file) => (
            <li key={file.path}>
              <a
                href={`${STOREFRONT_URL}${file.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-background"
              >
                {file.label}
                <ExternalLink className="h-3.5 w-3.5 text-muted" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={handleAdd} className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-semibold">URL redirects</h2>
        <p className="mt-1 text-sm text-muted">When an old URL should point to a new one (301 or 302).</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <input
            required
            placeholder="/old-path"
            value={form.fromPath}
            onChange={(e) => setForm({ ...form, fromPath: e.target.value })}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="/new-path"
            value={form.toPath}
            onChange={(e) => setForm({ ...form, toPath: e.target.value })}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          />
          <select
            value={form.statusCode}
            onChange={(e) => setForm({ ...form, statusCode: Number(e.target.value) })}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            <option value={301}>301 Permanent</option>
            <option value={302}>302 Temporary</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-surface"
        >
          <Plus className="h-4 w-4" />
          Add redirect
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">To</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {redirects.map((r) => (
              <tr key={r._id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{r.fromPath}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.toPath}</td>
                <td className="px-4 py-3">{r.statusCode}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => handleDelete(r._id)} className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
