import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminSettings, updateAdminSettings, type TenantSettings } from "../lib/api";
import { PageLoader } from "../components/Loading";

export function SettingsPage() {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAdminSettings()
      .then(setSettings)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setError("");
    setSaved(false);
    try {
      const updated = await updateAdminSettings({ name: settings.name });
      setSettings(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  if (!settings) return <PageLoader label="Loading settings…" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">Store Settings</h1>
        <p className="text-sm text-muted">General store identity. Homepage hero, sections, and content are managed in Homepage.</p>
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {saved && <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">Settings saved.</div>}

      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        Looking for hero banner, brand pillars, or homepage sections?{" "}
        <Link to="/homepage" className="font-medium text-secondary hover:underline">
          Go to Homepage →
        </Link>
      </div>

      <form onSubmit={handleSave} className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <label className="block text-sm">
          <span className="text-muted">Store name</span>
          <input
            value={settings.name}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
          />
        </label>
        <button type="submit" className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-surface">
          Save settings
        </button>
      </form>
    </div>
  );
}
