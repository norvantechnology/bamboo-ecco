import { useEffect, useState } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { ImageUpload } from "../components/ImageUpload";
import { useRefetchOnFocus } from "../lib/useRefetchOnFocus";
import { Field, FieldRow, Panel, Select, TextArea, TextInput } from "../components/ui/form";
import {
  getAdminContent,
  createContentPage,
  updateContentPage,
  deleteContentPage,
  type AdminContentPage,
} from "../lib/api";

const emptyForm = {
  slug: "",
  title: "",
  body: "",
  type: "static",
  heroImage: "",
  imageCredit: "",
  metaTitle: "",
  metaDescription: "",
  footerGroup: "" as "" | "explore" | "help" | "legal",
  footerOrder: 0,
};

const TYPE_LABELS: Record<string, string> = {
  static: "Page",
  blog: "Blog",
  guide: "Guide",
};

const FILTERS = [
  { value: "", label: "All" },
  { value: "static", label: "Pages" },
  { value: "blog", label: "Blog" },
  { value: "guide", label: "Guides" },
];

export function ContentPage() {
  const [pages, setPages] = useState<AdminContentPage[]>([]);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminContentPage | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showEditor, setShowEditor] = useState(false);

  function load() {
    getAdminContent(filter || undefined)
      .then(setPages)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  useEffect(() => {
    load();
  }, [filter]);

  useRefetchOnFocus(load, { enabled: !showEditor });

  function startNew() {
    setEditing(null);
    setForm(emptyForm);
    setShowEditor(true);
    setError("");
  }

  function startEdit(page: AdminContentPage) {
    setEditing(page);
    setForm({
      slug: page.slug,
      title: page.title,
      body: page.body,
      type: page.type,
      heroImage: page.heroImage ?? "",
      imageCredit: page.imageCredit ?? "",
      metaTitle: page.meta?.title ?? "",
      metaDescription: page.meta?.description ?? "",
      footerGroup: page.footerGroup ?? "",
      footerOrder: page.footerOrder ?? 0,
    });
    setShowEditor(true);
    setError("");
  }

  function closeEditor() {
    setShowEditor(false);
    setEditing(null);
    setForm(emptyForm);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      slug: form.slug,
      title: form.title,
      body: form.body,
      type: form.type,
      heroImage: form.heroImage || undefined,
      imageCredit: form.imageCredit || undefined,
      meta: {
        title: form.metaTitle || undefined,
        description: form.metaDescription || undefined,
      },
      footerGroup:
        form.type === "static" && form.footerGroup
          ? (form.footerGroup as "explore" | "help" | "legal")
          : null,
      footerOrder: form.type === "static" ? form.footerOrder : 0,
    };
    try {
      if (editing) {
        await updateContentPage(editing._id, payload);
      } else {
        await createContentPage(payload);
      }
      closeEditor();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this page?")) return;
    await deleteContentPage(id);
    if (editing?._id === id) closeEditor();
    load();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Site pages"
        action={
          <button
            type="button"
            onClick={startNew}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-surface"
          >
            <Plus className="h-4 w-4" />
            New page
          </button>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-foreground text-surface"
                : "border border-border text-muted hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Page list */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-surface">
            {pages.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <FileText className="h-8 w-8 text-muted" />
                <p className="text-sm text-muted">No pages yet</p>
                <button type="button" onClick={startNew} className="text-sm font-medium text-secondary hover:underline">
                  Create your first page
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {pages.map((page) => (
                  <li key={page._id}>
                    <button
                      type="button"
                      onClick={() => startEdit(page)}
                      className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-background ${
                        editing?._id === page._id ? "bg-accent/5" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{page.title}</p>
                        <p className="truncate text-xs text-muted">/{page.slug}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                        {TYPE_LABELS[page.type] ?? page.type}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          {!showEditor ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 text-center">
              <p className="text-sm text-muted">Select a page from the list, or create a new one.</p>
              <button
                type="button"
                onClick={startNew}
                className="mt-3 text-sm font-medium text-secondary hover:underline"
              >
                + New page
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <Panel
                title={editing ? "Edit page" : "New page"}
                action={
                  <button type="button" onClick={closeEditor} className="text-xs text-muted hover:text-foreground">
                    Cancel
                  </button>
                }
              >
                <FieldRow>
                  <Field label="URL slug">
                    <TextInput
                      required
                      placeholder="about-us"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    />
                  </Field>
                  <Field label="Type">
                    <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="static">Page</option>
                      <option value="blog">Blog post</option>
                      <option value="guide">Buying guide</option>
                    </Select>
                  </Field>
                </FieldRow>
                <Field label="Page title">
                  <TextInput
                    required
                    placeholder="About Us"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </Field>
              </Panel>

              <Panel title="Featured Image / Banner">
                <div className="space-y-4">
                  {form.heroImage ? (
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-border bg-muted/20">
                      <img src={form.heroImage} alt={form.title} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, heroImage: "" })}
                        className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-1 text-xs text-white hover:bg-black"
                      >
                        Remove image
                      </button>
                    </div>
                  ) : null}

                  <FieldRow>
                    <Field label="Hero Banner Image URL">
                      <TextInput
                        placeholder="https://res.cloudinary.com/.../banner.jpg"
                        value={form.heroImage}
                        onChange={(e) => setForm({ ...form, heroImage: e.target.value })}
                      />
                    </Field>
                    <Field label="Upload banner">
                      <ImageUpload
                        folder="content"
                        slug={form.slug}
                        label="Upload Hero Image"
                        onUploaded={(res) => setForm({ ...form, heroImage: res.url })}
                      />
                    </Field>
                  </FieldRow>

                  <Field label="Image Credit / Caption (Optional)">
                    <TextInput
                      placeholder="Photo by Tripura Artisan Collective"
                      value={form.imageCredit}
                      onChange={(e) => setForm({ ...form, imageCredit: e.target.value })}
                    />
                  </Field>
                </div>
              </Panel>

              <Panel title="Content">
                <Field label="Body (HTML)">
                  <TextArea
                    required
                    rows={10}
                    placeholder="<p>Your content here…</p>"
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    className="font-mono text-xs"
                  />
                </Field>
              </Panel>

              <Panel title="SEO">
                <FieldRow>
                  <Field label="Meta title">
                    <TextInput
                      placeholder="Shown in Google search results"
                      value={form.metaTitle}
                      onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                    />
                  </Field>
                  <Field label="Meta description">
                    <TextInput
                      placeholder="Short summary for search engines"
                      value={form.metaDescription}
                      onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                    />
                  </Field>
                </FieldRow>
              </Panel>

              {form.type === "static" && (
                <Panel title="Footer">
                  <FieldRow>
                    <Field label="Footer section">
                      <Select
                        value={form.footerGroup}
                        onChange={(e) =>
                          setForm({ ...form, footerGroup: e.target.value as typeof form.footerGroup })
                        }
                      >
                        <option value="">Not in footer</option>
                        <option value="explore">Explore</option>
                        <option value="help">Help</option>
                        <option value="legal">Legal</option>
                      </Select>
                    </Field>
                    <Field label="Sort order">
                      <TextInput
                        type="number"
                        min={0}
                        value={form.footerOrder}
                        onChange={(e) => setForm({ ...form, footerOrder: Number(e.target.value) })}
                      />
                    </Field>
                  </FieldRow>
                </Panel>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-foreground px-5 py-2 text-sm font-medium text-surface"
                >
                  {editing ? "Save page" : "Create page"}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editing._id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
