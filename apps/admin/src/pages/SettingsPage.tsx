import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminSettings, updateAdminSettings, type TenantSettings } from "../lib/api";
import { PageLoader } from "../components/Loading";
import { Field, Panel, TextInput, Toggle } from "../components/ui/form";

export function SettingsPage() {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      const updated = await updateAdminSettings({
        name: settings.name,
        paymentEnabled: settings.paymentEnabled !== false,
      });
      setSettings(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <PageLoader label="Loading settings…" />;

  const paymentOn = settings.paymentEnabled !== false;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">Store Settings</h1>
        <p className="text-sm text-muted">
          General store identity and checkout. Search listing and Google verification are in{" "}
          <Link to="/seo" className="font-medium text-secondary hover:underline">
            SEO
          </Link>
          .
        </p>
      </div>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Settings saved.
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        Looking for hero banner, brand pillars, or homepage sections?{" "}
        <Link to="/homepage" className="font-medium text-secondary hover:underline">
          Go to Homepage →
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <Panel title="Store identity">
          <Field label="Store name">
            <TextInput
              value={settings.name}
              onChange={(e) => {
                setSettings({ ...settings, name: e.target.value });
                setSaved(false);
              }}
            />
          </Field>
        </Panel>

        <Panel title="Payments">
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background p-4">
            <div className="min-w-0">
              <p className="font-medium">Online payment (Razorpay)</p>
              <p className="mt-1 text-sm text-muted">
                {paymentOn
                  ? "Customers pay online at checkout when Razorpay keys are configured."
                  : "Payment is skipped. Customers still place orders — checkout completes without Razorpay."}
              </p>
            </div>
            <Toggle
              checked={paymentOn}
              onChange={(checked) => {
                setSettings({ ...settings, paymentEnabled: checked });
                setSaved(false);
              }}
              label={paymentOn ? "Enabled" : "Disabled"}
            />
          </div>
        </Panel>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-surface disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
