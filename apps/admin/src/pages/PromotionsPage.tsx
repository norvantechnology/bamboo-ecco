import { useEffect, useState } from "react";
import { getAdminSettings, updateAdminSettings, type TenantSettings } from "../lib/api";
import { PageLoader } from "../components/Loading";
import { PageHeader } from "../components/PageHeader";
import { Field, FieldRow, Panel, SaveBar, Select, TextArea, TextInput, Toggle, ColorInput } from "../components/ui/form";

export function PromotionsPage() {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminSettings()
      .then(setSettings)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

  function markDirty() {
    setSaved(false);
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateAdminSettings({
        welcomePopup: settings.welcomePopup,
        announcementBar: settings.announcementBar,
      });
      setSettings(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <PageLoader label="Loading promotions…" />;

  const popup = settings.welcomePopup ?? {
    enabled: false,
    mode: "html" as const,
    html: "",
    imageUrl: "",
    imageLink: "",
  };

  const bar = settings.announcementBar ?? {
    enabled: false,
    html: "",
    backgroundColor: "#5c6b52",
    textColor: "#ffffff",
    animation: "marquee" as const,
    dismissible: true,
  };

  const colorPresets = ["#5c6b52", "#4B3621", "#7A8F6B", "#C4A962", "#1a1816", "#dc2626", "#2563eb", "#ffffff", "#000000"];

  return (
    <div className="space-y-5 pb-20">
      <PageHeader
        title="Promotions"
        description="Welcome popup on the homepage and the announcement bar at the top of the site."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Panel
        title="Welcome popup"
        action={
          <Toggle
            checked={popup.enabled}
            onChange={(enabled) => {
              setSettings({ ...settings, welcomePopup: { ...popup, enabled } });
              markDirty();
            }}
            label={popup.enabled ? "On" : "Off"}
          />
        }
      >
        <p className="text-sm text-muted">
          Shows when a visitor opens or refreshes the homepage. Closes when they click away — shows again on next visit.
        </p>

        <Field label="Content type">
          <Select
            value={popup.mode}
            onChange={(e) => {
              setSettings({
                ...settings,
                welcomePopup: { ...popup, mode: e.target.value as "html" | "image" },
              });
              markDirty();
            }}
          >
            <option value="html">HTML content</option>
            <option value="image">Image only</option>
          </Select>
        </Field>

        {popup.mode === "html" ? (
          <Field label="HTML content" hint='Use HTML for content. Close button: onclick="closePopup()" or data-close-popup on any element.'>
            <TextArea
              rows={8}
              placeholder="<p>Welcome! <strong>10% off</strong> your first order.</p>"
              value={popup.html}
              onChange={(e) => {
                setSettings({ ...settings, welcomePopup: { ...popup, html: e.target.value } });
                markDirty();
              }}
              className="font-mono text-xs"
            />
          </Field>
        ) : (
          <FieldRow>
            <Field label="Image URL">
              <TextInput
                value={popup.imageUrl}
                onChange={(e) => {
                  setSettings({ ...settings, welcomePopup: { ...popup, imageUrl: e.target.value } });
                  markDirty();
                }}
                placeholder="https://…"
              />
            </Field>
            <Field label="Link when clicked (optional)">
              <TextInput
                value={popup.imageLink}
                onChange={(e) => {
                  setSettings({ ...settings, welcomePopup: { ...popup, imageLink: e.target.value } });
                  markDirty();
                }}
                placeholder="/shop"
              />
            </Field>
          </FieldRow>
        )}
      </Panel>

      <Panel
        title="Announcement bar"
        action={
          <Toggle
            checked={bar.enabled}
            onChange={(enabled) => {
              setSettings({ ...settings, announcementBar: { ...bar, enabled } });
              markDirty();
            }}
            label={bar.enabled ? "On" : "Off"}
          />
        }
      >
        <p className="text-sm text-muted">
          Thin headline strip above the header on every page — great for offers and shipping notes.
        </p>

        <Field label="Headline (HTML)">
          <TextInput
            value={bar.html}
            onChange={(e) => {
              setSettings({ ...settings, announcementBar: { ...bar, html: e.target.value } });
              markDirty();
            }}
            placeholder="Free shipping on orders over ₹999 — <strong>Shop now</strong>"
          />
        </Field>

        <FieldRow cols={2}>
          <Field label="Background colour" hint="Pick a swatch or type a hex code (e.g. #5c6b52)">
            <ColorInput
              value={bar.backgroundColor}
              presets={colorPresets}
              onChange={(backgroundColor) => {
                setSettings({ ...settings, announcementBar: { ...bar, backgroundColor } });
                markDirty();
              }}
            />
          </Field>
          <Field label="Text colour" hint="Pick a swatch or type a hex code (e.g. #ffffff)">
            <ColorInput
              value={bar.textColor}
              presets={colorPresets}
              onChange={(textColor) => {
                setSettings({ ...settings, announcementBar: { ...bar, textColor } });
                markDirty();
              }}
            />
          </Field>
        </FieldRow>

        <Field label="Preview">
          <div
            className="rounded-lg px-4 py-2.5 text-center text-sm font-medium"
            style={{ backgroundColor: bar.backgroundColor, color: bar.textColor }}
          >
            {bar.html.trim() ? (
              <span dangerouslySetInnerHTML={{ __html: bar.html }} />
            ) : (
              "Your announcement headline will appear here"
            )}
          </div>
        </Field>

        <Field label="Animation">
          <Select
            value={bar.animation}
            onChange={(e) => {
              setSettings({
                ...settings,
                announcementBar: {
                  ...bar,
                  animation: e.target.value as typeof bar.animation,
                },
              });
              markDirty();
            }}
          >
            <option value="marquee">Scrolling marquee</option>
            <option value="pulse">Gentle pulse</option>
            <option value="slide">Slide in</option>
            <option value="none">None</option>
          </Select>
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={bar.dismissible}
            onChange={(e) => {
              setSettings({ ...settings, announcementBar: { ...bar, dismissible: e.target.checked } });
              markDirty();
            }}
            className="rounded border-border"
          />
          Allow visitors to dismiss (until they close the browser tab)
        </label>
      </Panel>

      <SaveBar onSave={handleSave} saving={saving} saved={saved} label="Save promotions" />
    </div>
  );
}
