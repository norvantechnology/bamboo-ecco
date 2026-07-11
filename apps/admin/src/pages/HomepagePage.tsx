import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import {
  getAdminSettings,
  updateAdminSettings,
  getCustomerPhotos,
  createCustomerPhoto,
  updateCustomerPhoto,
  deleteCustomerPhoto,
  getMediaConfig,
  getAdminProducts,
  getAdminCategories,
  getAdminReviews,
  getAdminGallery,
  getAdminContent,
  type HomepageSections,
  type HomepageSection,
  type CustomerPhotoItem,
  type TenantSettings,
} from "../lib/api";
import { ImageUpload } from "../components/ImageUpload";
import { PageLoader } from "../components/Loading";
import { PageHeader } from "../components/PageHeader";
import { useRefetchOnFocus } from "../lib/useRefetchOnFocus";
import {
  Field,
  FieldRow,
  Panel,
  SaveBar,
  TextArea,
  TextInput,
  Toggle,
} from "../components/ui/form";

type SectionKey = keyof HomepageSections;
type PillarItem = { icon: string; title: string; description: string };

const ICON_OPTIONS = ["leaf", "sparkles", "home", "sprout", "hand", "truck", "recycle", "shield", "users", "package"];

const SECTION_ORDER: SectionKey[] = [
  "collections",
  "lifestyle",
  "newArrivals",
  "bestSellers",
  "whyChooseUs",
  "customerHomes",
  "reviews",
  "journal",
  "gallery",
];

const SECTION_META: Record<
  SectionKey,
  {
    name: string;
    manageLink?: string;
    manageLabel?: string;
    countKey: keyof HomepageCounts;
    fields: { description?: boolean; href?: boolean; linkText?: boolean };
  }
> = {
  collections: {
    name: "Featured Collections",
    manageLink: "/categories",
    manageLabel: "Categories",
    countKey: "categoriesWithImage",
    fields: { description: true },
  },
  lifestyle: {
    name: "In Real Homes",
    manageLink: "/products",
    manageLabel: "Products",
    countKey: "lifestyleProducts",
    fields: { description: true },
  },
  newArrivals: {
    name: "New Arrivals",
    manageLink: "/products",
    manageLabel: "Products",
    countKey: "newArrivals",
    fields: { description: true, href: true },
  },
  bestSellers: {
    name: "Best Sellers",
    manageLink: "/products",
    manageLabel: "Products",
    countKey: "featuredProducts",
    fields: { description: true, href: true },
  },
  whyChooseUs: {
    name: "Why Choose Us",
    countKey: "whyChooseUsItems",
    fields: {},
  },
  customerHomes: {
    name: "Customer Homes",
    countKey: "publishedPhotos",
    fields: { description: true },
  },
  reviews: {
    name: "Customer Reviews",
    manageLink: "/reviews",
    manageLabel: "Reviews",
    countKey: "approvedReviews",
    fields: {},
  },
  journal: {
    name: "Journal",
    manageLink: "/content",
    manageLabel: "Site pages",
    countKey: "journalPosts",
    fields: { description: true, href: true, linkText: true },
  },
  gallery: {
    name: "Instagram Gallery",
    manageLink: "/media",
    manageLabel: "Media",
    countKey: "galleryItems",
    fields: {},
  },
};

interface HomepageCounts {
  categoriesWithImage: number;
  featuredProducts: number;
  newArrivals: number;
  lifestyleProducts: number;
  approvedReviews: number;
  publishedPhotos: number;
  galleryItems: number;
  journalPosts: number;
  whyChooseUsItems: number;
  brandPillarsItems: number;
}

function emptyPillar(): PillarItem {
  return { icon: "leaf", title: "", description: "" };
}

function PillarEditor({
  items,
  onChange,
}: {
  items: PillarItem[];
  onChange: (items: PillarItem[]) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="grid gap-2 rounded-lg border border-border bg-background p-3 sm:grid-cols-[100px_1fr_1fr_auto]"
        >
          <select
            value={item.icon}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...item, icon: e.target.value };
              onChange(next);
            }}
            className="rounded-lg border border-border bg-background px-2 py-2 text-sm"
          >
            {ICON_OPTIONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
          <input
            placeholder="Title"
            value={item.title}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...item, title: e.target.value };
              onChange(next);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            placeholder="Description"
            value={item.description}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...item, description: e.target.value };
              onChange(next);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
            aria-label="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, emptyPillar()])}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-background"
      >
        <Plus className="h-3.5 w-3.5" />
        Add item
      </button>
    </div>
  );
}

function SectionFields({
  sectionKey,
  section,
  onChange,
}: {
  sectionKey: SectionKey;
  section: HomepageSection;
  onChange: (patch: Partial<HomepageSection>) => void;
}) {
  const { fields } = SECTION_META[sectionKey];

  return (
    <>
      <FieldRow cols={2}>
        <Field label="Label">
          <TextInput
            value={section.label}
            onChange={(e) => onChange({ label: e.target.value })}
          />
        </Field>
        <Field label="Heading">
          <TextInput
            value={section.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </Field>
      </FieldRow>
      {fields.description && (
        <Field label="Description">
          <TextInput
            value={section.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </Field>
      )}
      {(fields.href || fields.linkText) && (
        <FieldRow cols={2}>
          {fields.href && (
            <Field label="View all link">
              <TextInput
                value={section.href ?? ""}
                onChange={(e) => onChange({ href: e.target.value })}
                placeholder="/new-arrivals"
              />
            </Field>
          )}
          {fields.linkText && (
            <Field label="Link text">
              <TextInput
                value={section.linkText ?? ""}
                onChange={(e) => onChange({ linkText: e.target.value })}
                placeholder="Read all"
              />
            </Field>
          )}
        </FieldRow>
      )}
    </>
  );
}

export function HomepagePage() {
  const [sections, setSections] = useState<HomepageSections | null>(null);
  const [hero, setHero] = useState<TenantSettings["hero"] | null>(null);
  const [tagline, setTagline] = useState("");
  const [brandPillars, setBrandPillars] = useState<PillarItem[]>([]);
  const [whyChooseUs, setWhyChooseUs] = useState<PillarItem[]>([]);
  const [counts, setCounts] = useState<HomepageCounts>({
    categoriesWithImage: 0,
    featuredProducts: 0,
    newArrivals: 0,
    lifestyleProducts: 0,
    approvedReviews: 0,
    publishedPhotos: 0,
    galleryItems: 0,
    journalPosts: 0,
    whyChooseUsItems: 0,
    brandPillarsItems: 0,
  });
  const [photos, setPhotos] = useState<CustomerPhotoItem[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cloudinaryReady, setCloudinaryReady] = useState(false);
  const [photoForm, setPhotoForm] = useState({
    imageUrl: "",
    customerName: "",
    caption: "",
    published: true,
  });

  function markDirty() {
    setSaved(false);
  }

  function loadCounts() {
    Promise.all([
      getAdminCategories(),
      getAdminProducts(),
      getAdminReviews("approved"),
      getCustomerPhotos(),
      getAdminGallery(),
      getAdminContent(),
    ])
      .then(([categories, products, reviews, customerPhotos, gallery, content]) => {
        const roots = categories.filter((c) => !c.parentId);
        setCounts((c) => ({
          ...c,
          categoriesWithImage: roots.filter((cat) => cat.imageUrl).length,
          featuredProducts: products.filter(
            (p) => p.isFeatured && (p.status === "active" || p.status === "out_of_stock"),
          ).length,
          newArrivals: products.filter(
            (p) => p.isNewArrival && (p.status === "active" || p.status === "out_of_stock"),
          ).length,
          lifestyleProducts: products.filter(
            (p) =>
              (p.status === "active" || p.status === "out_of_stock") &&
              p.images?.some((img) => img.type === "lifestyle"),
          ).length,
          approvedReviews: reviews.length,
          publishedPhotos: customerPhotos.filter((p) => p.published).length,
          galleryItems: gallery.length,
          journalPosts: content.filter((p) => p.type === "blog" || p.type === "guide").length,
        }));
        setPhotos(customerPhotos);
      })
      .catch(() => {});
  }

  useEffect(() => {
    getAdminSettings()
      .then((s) => {
        setSections(s.homepageSections ?? null);
        setHero(s.hero);
        setTagline(s.tagline);
        setBrandPillars(s.brandPillars ?? []);
        setWhyChooseUs(s.whyChooseUs ?? []);
        setCounts((c) => ({
          ...c,
          whyChooseUsItems: (s.whyChooseUs ?? []).filter((i) => i.title).length,
          brandPillarsItems: (s.brandPillars ?? []).filter((i) => i.title).length,
        }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
    loadCounts();
    getMediaConfig()
      .then((c) => setCloudinaryReady(c.configured))
      .catch(() => setCloudinaryReady(false));
  }, []);

  useRefetchOnFocus(
    () => {
      getAdminSettings()
        .then((s) => {
          setSections(s.homepageSections ?? null);
          setHero(s.hero);
          setTagline(s.tagline);
          setBrandPillars(s.brandPillars ?? []);
          setWhyChooseUs(s.whyChooseUs ?? []);
        })
        .catch(() => {});
      loadCounts();
    },
    // Don't overwrite in-progress edits when returning from Preview / file picker
    { enabled: saved },
  );

  function updateSection(key: SectionKey, patch: Partial<HomepageSection>) {
    if (!sections) return;
    setSections({ ...sections, [key]: { ...sections[key], ...patch } });
    markDirty();
  }

  async function saveAll() {
    if (!sections || !hero) return;
    setSaving(true);
    setError("");
    try {
      const updated = await updateAdminSettings({
        tagline,
        hero,
        brandPillars: brandPillars.filter((p) => p.title.trim()),
        whyChooseUs: whyChooseUs.filter((p) => p.title.trim()),
        homepageSections: sections,
      });
      setSections(updated.homepageSections ?? sections);
      setBrandPillars(updated.brandPillars ?? brandPillars);
      setWhyChooseUs(updated.whyChooseUs ?? whyChooseUs);
      setCounts((c) => ({
        ...c,
        whyChooseUsItems: (updated.whyChooseUs ?? []).filter((i) => i.title).length,
        brandPillarsItems: (updated.brandPillars ?? []).filter((i) => i.title).length,
      }));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function addPhoto(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createCustomerPhoto({ ...photoForm, sortOrder: photos.length });
      setPhotoForm({ imageUrl: "", customerName: "", caption: "", published: true });
      loadCounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add photo");
    }
  }

  async function togglePhotoPublished(photo: CustomerPhotoItem) {
    await updateCustomerPhoto(photo._id, { published: !photo.published });
    loadCounts();
  }

  if (!sections || !hero) return <PageLoader label="Loading homepage…" />;

  const storefrontUrl = import.meta.env.VITE_STOREFRONT_URL || "http://localhost:3000";

  return (
    <div className="space-y-5 pb-20">
      <PageHeader
        title="Homepage"
        action={
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-background"
          >
            <ExternalLink className="h-4 w-4" />
            Preview
          </a>
        }
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Hero */}
      <Panel id="section-hero" title="Hero banner">
        <Field label="Tagline">
          <TextInput
            value={tagline}
            onChange={(e) => {
              setTagline(e.target.value);
              markDirty();
            }}
          />
        </Field>
        <FieldRow>
          <Field label="Headline">
            <TextInput
              value={hero.headline}
              onChange={(e) => {
                setHero({ ...hero, headline: e.target.value });
                markDirty();
              }}
            />
          </Field>
          <Field label="Hero image URL">
            <TextInput
              value={hero.imageUrl ?? ""}
              onChange={(e) => {
                setHero({ ...hero, imageUrl: e.target.value });
                markDirty();
              }}
            />
          </Field>
        </FieldRow>
        <Field label="Subheading">
          <TextArea
            rows={2}
            value={hero.subheading}
            onChange={(e) => {
              setHero({ ...hero, subheading: e.target.value });
              markDirty();
            }}
          />
        </Field>
        <FieldRow>
          <Field label="Primary button">
            <TextInput
              value={hero.primaryCta}
              onChange={(e) => {
                setHero({ ...hero, primaryCta: e.target.value });
                markDirty();
              }}
            />
          </Field>
          <Field label="Secondary button">
            <TextInput
              value={hero.secondaryCta}
              onChange={(e) => {
                setHero({ ...hero, secondaryCta: e.target.value });
                markDirty();
              }}
            />
          </Field>
        </FieldRow>
      </Panel>

      {/* Brand pillars */}
      <Panel id="section-pillars" title="Brand pillars">
        <PillarEditor
          items={brandPillars}
          onChange={(items) => {
            setBrandPillars(items);
            markDirty();
          }}
        />
      </Panel>

      {/* Homepage sections */}
      {SECTION_ORDER.map((key) => {
        const section = sections[key];
        const meta = SECTION_META[key];
        const itemCount =
          key === "whyChooseUs"
            ? whyChooseUs.filter((i) => i.title.trim()).length
            : counts[meta.countKey];

        return (
          <Panel
            key={key}
            id={`section-${key}`}
            title={meta.name}
            action={
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">{itemCount} items</span>
                {meta.manageLink && (
                  <Link
                    to={meta.manageLink}
                    className="text-xs font-medium text-secondary hover:underline"
                  >
                    {meta.manageLabel} →
                  </Link>
                )}
                <Toggle
                  checked={section.enabled}
                  onChange={(enabled) => updateSection(key, { enabled })}
                  label={section.enabled ? "Visible" : "Hidden"}
                />
              </div>
            }
          >
            <SectionFields
              sectionKey={key}
              section={section}
              onChange={(patch) => updateSection(key, patch)}
            />

            {key === "whyChooseUs" && (
              <div className="border-t border-border pt-4">
                <PillarEditor
                  items={whyChooseUs}
                  onChange={(items) => {
                    setWhyChooseUs(items);
                    markDirty();
                  }}
                />
              </div>
            )}

            {key === "customerHomes" && (
              <div className="space-y-4 border-t border-border pt-4">
                <form onSubmit={addPhoto} className="space-y-3 rounded-lg border border-border bg-background p-4">
                  {cloudinaryReady && (
                    <ImageUpload
                      folder="customer-homes"
                      alt={photoForm.caption || photoForm.customerName || "Customer home"}
                      caption={photoForm.caption}
                      onUploaded={(r) => setPhotoForm((f) => ({ ...f, imageUrl: r.url }))}
                    />
                  )}
                  <FieldRow>
                    <Field label="Image URL">
                      <TextInput
                        required
                        value={photoForm.imageUrl}
                        onChange={(e) => setPhotoForm({ ...photoForm, imageUrl: e.target.value })}
                      />
                    </Field>
                    <Field label="Customer name">
                      <TextInput
                        required
                        value={photoForm.customerName}
                        onChange={(e) => setPhotoForm({ ...photoForm, customerName: e.target.value })}
                      />
                    </Field>
                  </FieldRow>
                  <Field label="Caption">
                    <TextInput
                      value={photoForm.caption}
                      onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })}
                    />
                  </Field>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-surface"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add photo
                  </button>
                </form>
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {photos.map((photo) => (
                      <div
                        key={photo._id}
                        className={`overflow-hidden rounded-lg border ${photo.published ? "border-border" : "border-dashed opacity-60"}`}
                      >
                        <img
                          src={photo.imageUrl}
                          alt={photo.caption}
                          className="aspect-square w-full object-cover"
                          loading="lazy"
                        />
                        <div className="flex items-center justify-between gap-1 p-2">
                          <p className="truncate text-xs font-medium">{photo.customerName}</p>
                          <div className="flex gap-0.5">
                            <button
                              type="button"
                              onClick={() => togglePhotoPublished(photo)}
                              className="rounded px-1.5 py-0.5 text-[10px] text-muted hover:bg-background"
                            >
                              {photo.published ? "Hide" : "Show"}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteCustomerPhoto(photo._id).then(loadCounts)}
                              className="rounded p-1 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Panel>
        );
      })}

      <SaveBar onSave={saveAll} saving={saving} saved={saved} label="Save homepage" />
    </div>
  );
}
