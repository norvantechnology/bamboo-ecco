import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, ExternalLink, Save } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { PageLoader } from "../components/Loading";
import {
  getAdminRedirects,
  createRedirect,
  deleteRedirect,
  getAdminSettings,
  updateAdminSettings,
  type AdminRedirect,
  type TenantSeoSettings,
  type TenantSettings,
} from "../lib/api";

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL || "http://localhost:3000";

const SEO_FILES = [
  { path: "/robots.txt", label: "robots.txt", hint: "Crawler rules" },
  { path: "/sitemap.xml", label: "Sitemap", hint: "All public URLs" },
  { path: "/llms.txt", label: "llms.txt", hint: "AI discovery" },
  { path: "/ai.txt", label: "ai.txt", hint: "AI usage policy" },
];

const EMPTY_SEO: TenantSeoSettings = {
  description: "",
  defaultTitle: "",
  locale: "en_IN",
  themeColor: "#4B3621",
  backgroundColor: "#FAF8F3",
  gscVerification: "",
};

export function SeoPage() {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [seo, setSeo] = useState<TenantSeoSettings>(EMPTY_SEO);
  const [storeName, setStoreName] = useState("");
  const [redirects, setRedirects] = useState<AdminRedirect[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savingSeo, setSavingSeo] = useState(false);
  const [form, setForm] = useState({ fromPath: "", toPath: "", statusCode: 301 });
  const [savingRedirect, setSavingRedirect] = useState(false);

  function load() {
    setError("");
    Promise.all([getAdminSettings(), getAdminRedirects()])
      .then(([s, r]) => {
        setSettings(s);
        setStoreName(s.name);
        setSeo(s.seo ?? EMPTY_SEO);
        setRedirects(r);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSaveSeo(e: React.FormEvent) {
    e.preventDefault();
    setSavingSeo(true);
    setError("");
    setSaved(false);
    try {
      const updated = await updateAdminSettings({
        name: storeName.trim(),
        seo: {
          description: seo.description.trim(),
          defaultTitle: seo.defaultTitle.trim(),
          locale: seo.locale.trim() || "en_IN",
          themeColor: seo.themeColor.trim() || "#4B3621",
          backgroundColor: seo.backgroundColor.trim() || "#FAF8F3",
          gscVerification: seo.gscVerification.trim(),
        },
      });
      setSettings(updated);
      setStoreName(updated.name);
      setSeo(updated.seo ?? EMPTY_SEO);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save SEO settings");
    } finally {
      setSavingSeo(false);
    }
  }

  async function handleAddRedirect(e: React.FormEvent) {
    e.preventDefault();
    setSavingRedirect(true);
    setError("");
    try {
      await createRedirect(form);
      setForm({ fromPath: "", toPath: "", statusCode: 301 });
      const list = await getAdminRedirects();
      setRedirects(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save redirect");
    } finally {
      setSavingRedirect(false);
    }
  }

  async function handleDeleteRedirect(id: string) {
    if (!confirm("Delete this redirect?")) return;
    await deleteRedirect(id);
    setRedirects(await getAdminRedirects());
  }

  if (!settings) return <PageLoader label="Loading SEO settings…" />;

  const titlePreview = `${storeName || "Store"} | ${seo.defaultTitle || "Default title"}`;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="SEO"
        description="Control how your store appears in Google and social previews. Page-level titles live on Products, Categories, and Site pages."
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          SEO settings saved. Redeploy is not required — the storefront picks these up from the API.
        </div>
      )}

      {/* 1. Search listing */}
      <form onSubmit={handleSaveSeo} className="space-y-6 rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold">Search listing</h2>
          <p className="mt-1 text-sm text-muted">
            Default title and description when a page does not set its own meta.
          </p>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-foreground">Store name</span>
          <span className="mt-0.5 block text-xs text-muted">Shown in the browser tab and as the site name in search.</span>
          <input
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            placeholder="Terra Living"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-foreground">Default title suffix</span>
          <span className="mt-0.5 block text-xs text-muted">
            Combined as: <span className="font-mono text-[11px]">{`{name} | {suffix}`}</span>
          </span>
          <input
            value={seo.defaultTitle}
            onChange={(e) => setSeo({ ...seo, defaultTitle: e.target.value })}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            placeholder="Bamboo Furniture & Home Decor"
          />
          <p className="mt-2 rounded-lg bg-background px-3 py-2 text-xs text-muted">
            Preview: <span className="font-medium text-foreground">{titlePreview}</span>
          </p>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-foreground">Meta description</span>
          <span className="mt-0.5 block text-xs text-muted">Aim for ~150–160 characters. Used on the homepage and as a fallback elsewhere.</span>
          <textarea
            rows={3}
            value={seo.description}
            onChange={(e) => setSeo({ ...seo, description: e.target.value })}
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            placeholder="Shop handcrafted bamboo furniture…"
          />
          <p className="mt-1 text-right text-xs text-muted">{seo.description.length}/160</p>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-foreground">Locale</span>
          <span className="mt-0.5 block text-xs text-muted">Open Graph / HTML language tag (e.g. en_IN, en_US).</span>
          <input
            value={seo.locale}
            onChange={(e) => setSeo({ ...seo, locale: e.target.value })}
            className="mt-2 w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            placeholder="en_IN"
          />
        </label>

        <div className="border-t border-border pt-6">
          <h2 className="text-base font-semibold">Browser & app colors</h2>
          <p className="mt-1 text-sm text-muted">Used by the web app icon, install prompt, and payment checkout theme.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium">Theme color</span>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={seo.themeColor || "#4B3621"}
                  onChange={(e) => setSeo({ ...seo, themeColor: e.target.value })}
                  className="h-10 w-12 cursor-pointer rounded border border-border bg-background p-1"
                />
                <input
                  value={seo.themeColor}
                  onChange={(e) => setSeo({ ...seo, themeColor: e.target.value })}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
                />
              </div>
            </label>
            <label className="block text-sm">
              <span className="font-medium">Background color</span>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={seo.backgroundColor || "#FAF8F3"}
                  onChange={(e) => setSeo({ ...seo, backgroundColor: e.target.value })}
                  className="h-10 w-12 cursor-pointer rounded border border-border bg-background p-1"
                />
                <input
                  value={seo.backgroundColor}
                  onChange={(e) => setSeo({ ...seo, backgroundColor: e.target.value })}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
                />
              </div>
            </label>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="text-base font-semibold">Google Search Console</h2>
          <p className="mt-1 text-sm text-muted">
            Paste only the <span className="font-mono text-xs">content</span> value from the HTML meta tag verification method.
          </p>
          <label className="mt-4 block text-sm">
            <span className="font-medium">Verification code</span>
            <input
              value={seo.gscVerification}
              onChange={(e) => setSeo({ ...seo, gscVerification: e.target.value })}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono"
              placeholder="google-site-verification=…"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <button
            type="submit"
            disabled={savingSeo}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-surface disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {savingSeo ? "Saving…" : "Save SEO settings"}
          </button>
          <p className="text-xs text-muted">
            Homepage hero copy stays in{" "}
            <Link to="/homepage" className="font-medium text-secondary hover:underline">
              Homepage
            </Link>
            .
          </p>
        </div>
      </form>

      {/* 2. Technical files */}
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-base font-semibold">Technical SEO files</h2>
        <p className="mt-1 text-sm text-muted">Auto-generated from your products and the settings above. Open to verify.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {SEO_FILES.map((file) => (
            <li key={file.path}>
              <a
                href={`${STOREFRONT_URL}${file.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:bg-background"
              >
                <span>
                  <span className="font-medium">{file.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{file.hint}</span>
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. Redirects */}
      <section className="space-y-4">
        <form onSubmit={handleAddRedirect} className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-base font-semibold">URL redirects</h2>
          <p className="mt-1 text-sm text-muted">Send old or broken links to the correct page (301 permanent or 302 temporary).</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <input
              required
              placeholder="/old-path"
              value={form.fromPath}
              onChange={(e) => setForm({ ...form, fromPath: e.target.value })}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono"
            />
            <input
              required
              placeholder="/new-path"
              value={form.toPath}
              onChange={(e) => setForm({ ...form, toPath: e.target.value })}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono"
            />
            <select
              value={form.statusCode}
              onChange={(e) => setForm({ ...form, statusCode: Number(e.target.value) })}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            >
              <option value={301}>301 Permanent</option>
              <option value={302}>302 Temporary</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={savingRedirect}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-surface disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {savingRedirect ? "Adding…" : "Add redirect"}
          </button>
        </form>

        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-4 py-3 font-medium">From</th>
                <th className="px-4 py-3 font-medium">To</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {redirects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    No redirects yet.
                  </td>
                </tr>
              ) : (
                redirects.map((r) => (
                  <tr key={r._id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{r.fromPath}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.toPath}</td>
                    <td className="px-4 py-3">{r.statusCode}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteRedirect(r._id)}
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                        aria-label="Delete redirect"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
