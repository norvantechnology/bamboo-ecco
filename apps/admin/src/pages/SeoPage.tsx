import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Trash2,
  ExternalLink,
  Save,
  Search,
  Globe,
  Share2,
  ShieldCheck,
  Link2,
  FileText,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { PageLoader } from "../components/Loading";

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Youtube = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
    <polygon points="10 15 15 12 10 9" />
  </svg>
);

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

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

// ---------------------------------------------------------------------------
// SEO technical files — all auto-generated from the DB / settings
// ---------------------------------------------------------------------------
const SEO_FILES = [
  { path: "/sitemap.xml",                label: "sitemap.xml",         hint: "All public URLs",              color: "text-blue-600",   badge: "SEO" },
  { path: "/robots.txt",                 label: "robots.txt",          hint: "Crawler & AI crawler rules",   color: "text-slate-600",  badge: "SEO" },
  { path: "/llms.txt",                   label: "llms.txt",            hint: "Live product index for LLMs",  color: "text-violet-600", badge: "AI" },
  { path: "/llms-full.txt",              label: "llms-full.txt",       hint: "Full product catalog for AI",  color: "text-violet-600", badge: "AI" },
  { path: "/ai.txt",                     label: "ai.txt",              hint: "AI crawl policy",              color: "text-violet-600", badge: "AI" },
  { path: "/.well-known/ai-plugin.json", label: "ai-plugin.json",     hint: "ChatGPT plugin manifest",      color: "text-emerald-600",badge: "AI" },
  { path: "/feed.xml",                   label: "feed.xml",            hint: "Google Merchant Center feed",  color: "text-orange-600", badge: "GMC" },
  { path: "/feed/pinterest.xml",         label: "pinterest.xml",       hint: "Pinterest Catalog feed",       color: "text-rose-600",   badge: "PIN" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function normalizeGsc(raw: string): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  const metaMatch = value.match(/content\s*=\s*["']([^"']+)["']/i);
  if (metaMatch) return metaMatch[1].trim();
  const eqMatch = value.match(/google-site-verification\s*=\s*(\S+)/i);
  if (eqMatch) return eqMatch[1].trim();
  if (value.includes("<") || value.includes(">")) return "";
  return value;
}

function normalizeToken(raw: string): string {
  const v = (raw ?? "").trim();
  const metaMatch = v.match(/content\s*=\s*["']([^"']+)["']/i);
  if (metaMatch) return metaMatch[1].trim();
  return v;
}

function charColor(len: number, warn: number, max: number) {
  if (len === 0) return "text-muted";
  if (len <= warn) return "text-emerald-600";
  if (len <= max) return "text-amber-600";
  return "text-red-600";
}

const EMPTY_SEO: TenantSeoSettings = {
  description: "",
  defaultTitle: "",
  locale: "en_IN",
  themeColor: "#4B3621",
  backgroundColor: "#FAF8F3",
  gscVerification: "",
  ogImage: "",
  twitterHandle: "",
  bingVerification: "",
  pinterestVerification: "",
  socialLinks: { instagram: "", facebook: "", youtube: "", pinterest: "", twitter: "" },
};

// ---------------------------------------------------------------------------
// Accordion section component
// ---------------------------------------------------------------------------
function Section({
  id,
  icon: Icon,
  title,
  description,
  badge,
  defaultOpen = true,
  children,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={id} className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-background/60 transition-colors"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border text-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">{title}</span>
            {badge && (
              <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
                {badge}
              </span>
            )}
          </span>
          <span className="block text-xs text-muted mt-0.5">{description}</span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
        )}
      </button>
      {open && <div className="border-t border-border px-5 py-5 space-y-5">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Character counter input
// ---------------------------------------------------------------------------
function CharInput({
  label,
  hint,
  value,
  onChange,
  warn,
  max,
  placeholder,
  multiline,
  rows,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  warn: number;
  max: number;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const len = value.length;
  const cc = charColor(len, warn, max);
  const pct = Math.min((len / max) * 100, 100);
  const barColor = len === 0 ? "bg-border" : len <= warn ? "bg-emerald-500" : len <= max ? "bg-amber-500" : "bg-red-500";

  const cls =
    "mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors";

  return (
    <label className="block text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      {multiline ? (
        <textarea
          rows={rows ?? 3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
          placeholder={placeholder}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
          placeholder={placeholder}
        />
      )}
      <div className="mt-1.5 flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-xs tabular-nums font-mono ${cc}`}>
          {len}/{max}
        </span>
      </div>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Google SERP preview
// ---------------------------------------------------------------------------
function SerpPreview({ title, description, url }: { title: string; description: string; url: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-3">Google Preview</p>
      <div className="max-w-xl">
        <p className="text-xs text-muted mb-1 truncate">{url}</p>
        <p className="text-[17px] font-normal text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-1">
          {title || "Store name | Title suffix"}
        </p>
        <p className="text-sm text-[#4d5156] leading-snug mt-1 line-clamp-2">
          {description || "Your meta description will appear here. Write a compelling summary of your store."}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Social Media Preview
// ---------------------------------------------------------------------------
function SocialSharePreview({
  title,
  description,
  ogImage,
  domain,
}: {
  title: string;
  description: string;
  ogImage: string;
  domain: string;
}) {
  const cleanDomain = domain.replace(/^https?:\/\//, "").split("/")[0] || "bambooecohub.com";

  return (
    <div className="rounded-xl border border-border bg-background p-4 mt-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-3">
        Social Media Preview (WhatsApp / Facebook)
      </p>
      <div className="max-w-md rounded-xl border border-border bg-muted/10 overflow-hidden shadow-sm">
        {ogImage ? (
          <div className="aspect-[1.91/1] w-full bg-slate-100 overflow-hidden border-b border-border">
            <img
              src={ogImage}
              alt="OG Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        ) : (
          <div className="aspect-[1.91/1] w-full bg-muted flex flex-col items-center justify-center border-b border-border text-muted">
            <Share2 className="h-8 w-8 opacity-40 mb-2" />
            <span className="text-xs">No OG Image specified</span>
          </div>
        )}
        <div className="p-3 bg-muted/30">
          <p className="text-[11px] uppercase tracking-wider text-muted font-semibold">
            {cleanDomain}
          </p>
          <p className="text-[14px] font-bold text-foreground mt-1 line-clamp-1">
            {title || "Bamboo Eco-Hub | Handcrafted Lamps"}
          </p>
          <p className="text-xs text-muted mt-0.5 line-clamp-2">
            {description || "No description provided."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SeoPage
// ---------------------------------------------------------------------------
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
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function load() {
    setError("");
    Promise.all([getAdminSettings(), getAdminRedirects()])
      .then(([s, r]) => {
        setSettings(s);
        setStoreName(s.name);
        setSeo({ ...EMPTY_SEO, ...(s.seo ?? {}) });
        setRedirects(r);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }

  useEffect(() => {
    load();
    return () => { if (savedTimer.current) clearTimeout(savedTimer.current); };
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
          gscVerification: normalizeGsc(seo.gscVerification),
          ogImage: seo.ogImage?.trim() || "",
          twitterHandle: seo.twitterHandle?.trim().replace(/^@/, "") || "",
          bingVerification: normalizeToken(seo.bingVerification ?? ""),
          pinterestVerification: normalizeToken(seo.pinterestVerification ?? ""),
          socialLinks: {
            instagram: seo.socialLinks?.instagram?.trim() || "",
            facebook:  seo.socialLinks?.facebook?.trim()  || "",
            youtube:   seo.socialLinks?.youtube?.trim()   || "",
            pinterest: seo.socialLinks?.pinterest?.trim() || "",
            twitter:   seo.socialLinks?.twitter?.trim()   || "",
          },
        },
      });
      setSettings(updated);
      setStoreName(updated.name);
      setSeo({ ...EMPTY_SEO, ...(updated.seo ?? {}) });
      setSaved(true);
      savedTimer.current = setTimeout(() => setSaved(false), 4000);
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
      setRedirects(await getAdminRedirects());
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

  const titlePreview = `${storeName || "Store"} | ${seo.defaultTitle || "Title suffix"}`;
  const urlPreview   = `${STOREFRONT_URL.replace(/^https?:\/\//, "")} › Homepage`;

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-10">
      <PageHeader
        title="SEO"
        description="Control how your store appears in Google, social previews, and AI search tools."
      />

      {/* Status banners */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          SEO settings saved — the storefront picks these up from the API automatically.
        </div>
      )}

      <form onSubmit={handleSaveSeo} className="space-y-4">

        {/* ── 1. Search listing ──────────────────────────────────────────── */}
        <Section
          id="search-listing"
          icon={Search}
          title="Search listing"
          description="Controls how your store appears in Google and other search engines."
        >
          <label className="block text-sm">
            <span className="font-medium text-foreground">Store name</span>
            <span className="mt-0.5 block text-xs text-muted">Shown in browser tab and as the site name in search results.</span>
            <input
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"
              placeholder="Bamboo Eco-Hub"
            />
          </label>

          <CharInput
            label="Default title suffix"
            hint={`Combined as: ${storeName || "Store"} | {suffix}`}
            value={seo.defaultTitle}
            onChange={(v) => setSeo({ ...seo, defaultTitle: v })}
            warn={50}
            max={70}
            placeholder="Handcrafted Bamboo Home Decor"
          />

          <CharInput
            label="Meta description"
            hint="Used on the homepage and as a fallback on any page without its own description."
            value={seo.description}
            onChange={(v) => setSeo({ ...seo, description: v })}
            warn={150}
            max={160}
            placeholder="Shop handcrafted bamboo lamps, lights and sustainable home decor online in India. Free shipping."
            multiline
            rows={3}
          />

          <SerpPreview
            title={titlePreview}
            description={seo.description}
            url={urlPreview}
          />

          <label className="block text-sm">
            <span className="font-medium text-foreground">Locale</span>
            <span className="mt-0.5 block text-xs text-muted">Open Graph &amp; HTML language tag.</span>
            <select
              value={seo.locale}
              onChange={(e) => setSeo({ ...seo, locale: e.target.value })}
              className="mt-2 w-full max-w-xs rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
            >
              <option value="en_IN">en_IN — English (India)</option>
              <option value="en_US">en_US — English (US)</option>
              <option value="en_GB">en_GB — English (UK)</option>
              <option value="hi_IN">hi_IN — Hindi (India)</option>
            </select>
          </label>
        </Section>

        {/* ── 2. Social sharing ──────────────────────────────────────────── */}
        <Section
          id="social"
          icon={Share2}
          title="Social sharing"
          description="Image and handle used when your pages are shared on WhatsApp, Instagram, Twitter/X, Facebook."
          badge="OG"
        >
          <label className="block text-sm">
            <span className="font-medium text-foreground">Default OG image URL</span>
            <span className="mt-0.5 block text-xs text-muted">
              Shown when pages are shared. Use a 1200×630px image. Upload via{" "}
              <Link to="/media" className="text-secondary underline">Media</Link> and paste the URL.
            </span>
            <input
              type="url"
              value={seo.ogImage ?? ""}
              onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"
              placeholder="https://bambooecohub.com/brand/og-default.jpg"
            />
          </label>
          <SocialSharePreview
            title={titlePreview}
            description={seo.description}
            ogImage={seo.ogImage ?? ""}
            domain={STOREFRONT_URL}
          />

          <label className="block text-sm">
            <span className="font-medium text-foreground">Twitter/X handle</span>
            <span className="mt-0.5 block text-xs text-muted">Used for Twitter Card meta tags. e.g. @bambooecohub</span>
            <div className="mt-2 flex items-center gap-0">
              <span className="rounded-l-xl border border-r-0 border-border bg-background px-3 py-2.5 text-sm text-muted">@</span>
              <input
                value={(seo.twitterHandle ?? "").replace(/^@/, "")}
                onChange={(e) => setSeo({ ...seo, twitterHandle: e.target.value.replace(/^@/, "") })}
                className="flex-1 rounded-r-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"
                placeholder="bambooecohub"
              />
            </div>
          </label>
        </Section>

        {/* ── 3. Social profiles (Schema.org) ───────────────────────────── */}
        <Section
          id="social-profiles"
          icon={Link2}
          title="Social profiles"
          description="Used in Schema.org Organization markup — helps Google, Gemini and AI models link your social profiles to your brand."
          badge="Schema"
          defaultOpen={false}
        >
          {[
            { key: "instagram", label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/bambooecohub" },
            { key: "facebook",  label: "Facebook",  icon: Facebook,  placeholder: "https://facebook.com/bambooecohub" },
            { key: "youtube",   label: "YouTube",   icon: Youtube,   placeholder: "https://youtube.com/@bambooecohub" },
            { key: "pinterest", label: "Pinterest", icon: Globe,     placeholder: "https://pinterest.com/bambooecohub" },
            { key: "twitter",   label: "Twitter/X", icon: Globe,     placeholder: "https://x.com/bambooecohub" },
          ].map(({ key, label, icon: Icon, placeholder }) => (
            <label key={key} className="block text-sm">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-muted" />
                {label}
              </span>
              <input
                type="url"
                value={(seo.socialLinks as Record<string, string>)?.[key] ?? ""}
                onChange={(e) =>
                  setSeo({ ...seo, socialLinks: { ...seo.socialLinks, [key]: e.target.value } })
                }
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"
                placeholder={placeholder}
              />
            </label>
          ))}
        </Section>

        {/* ── 4. Verification tokens ────────────────────────────────────── */}
        <Section
          id="verification"
          icon={ShieldCheck}
          title="Site verification"
          description="Paste the full meta tag or just the token — we extract and save only the token."
          badge="Verify"
          defaultOpen={false}
        >
          {[
            {
              key: "gscVerification" as const,
              label: "Google Search Console",
              normalize: normalizeGsc,
              placeholder: '<meta name="google-site-verification" content="…" />',
              guide: "https://search.google.com/search-console",
              hint: "HTML tag method → copy the full <meta> tag and paste here.",
            },
            {
              key: "bingVerification" as const,
              label: "Bing Webmaster Tools",
              normalize: normalizeToken,
              placeholder: '<meta name="msvalidate.01" content="…" />',
              guide: "https://www.bing.com/webmasters",
              hint: "Bing → Settings → Site verification → XML file or meta tag.",
            },
            {
              key: "pinterestVerification" as const,
              label: "Pinterest",
              normalize: normalizeToken,
              placeholder: '<meta name="p:domain_verify" content="…" />',
              guide: "https://pinterest.com/settings/claim",
              hint: "Pinterest → Settings → Claim → Website.",
            },
          ].map(({ key, label, normalize, placeholder, guide, hint }) => {
            const raw = (seo[key] as string) ?? "";
            const token = normalize(raw);
            const hasError = raw.trim() && !token;
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <a
                    href={guide}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-secondary hover:underline"
                  >
                    Open console <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {hint && <p className="text-xs text-muted">{hint}</p>}
                <input
                  value={raw}
                  onChange={(e) => setSeo({ ...seo, [key]: e.target.value })}
                  onBlur={(e) => setSeo({ ...seo, [key]: normalize(e.target.value) })}
                  className={`w-full rounded-xl border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-colors ${
                    hasError ? "border-red-400 text-red-700" : "border-border focus:border-secondary"
                  }`}
                  placeholder={placeholder}
                />
                {token && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1.5">
                    ✅ Token detected:{" "}
                    <span className="font-mono">{`<meta content="${token}" />`}</span>
                  </p>
                )}
                {hasError && (
                  <p className="text-xs text-red-600">
                    Could not detect a token. Paste the full &lt;meta&gt; tag from {label}.
                  </p>
                )}
              </div>
            );
          })}
        </Section>

        {/* ── 5. Browser & app colors ───────────────────────────────────── */}
        <Section
          id="colors"
          icon={Globe}
          title="Browser &amp; app colors"
          description="Used by the web app icon, install prompt, and payment checkout theme."
          defaultOpen={false}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Theme color", key: "themeColor" as const, default: "#4B3621" },
              { label: "Background color", key: "backgroundColor" as const, default: "#FAF8F3" },
            ].map(({ label, key, default: def }) => (
              <label key={key} className="block text-sm">
                <span className="font-medium text-foreground">{label}</span>
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="relative h-10 w-12 shrink-0 rounded-xl border border-border overflow-hidden cursor-pointer"
                    style={{ background: seo[key] || def }}
                  >
                    <input
                      type="color"
                      value={seo[key] || def}
                      onChange={(e) => setSeo({ ...seo, [key]: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <input
                    value={seo[key]}
                    onChange={(e) => setSeo({ ...seo, [key]: e.target.value })}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"
                    placeholder={def}
                  />
                </div>
              </label>
            ))}
          </div>
        </Section>

        {/* ── Save button ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-4 shadow-sm">
          <button
            type="submit"
            disabled={savingSeo}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-surface hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Save className="h-4 w-4" />
            {savingSeo ? "Saving…" : "Save SEO settings"}
          </button>
          <p className="text-xs text-muted">
            Per-product/category meta lives on{" "}
            <Link to="/products" className="font-medium text-secondary hover:underline">Products</Link>{" "}
            and{" "}
            <Link to="/categories" className="font-medium text-secondary hover:underline">Categories</Link>.
          </p>
        </div>
      </form>

      {/* ── 6. Technical SEO files ────────────────────────────────────── */}
      <div id="technical-files" className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border">
              <FileText className="h-4 w-4 text-foreground" />
            </span>
            <div>
              <p className="font-semibold text-sm text-foreground">Technical SEO files</p>
              <p className="text-xs text-muted mt-0.5">Auto-generated from your products and settings above. Click to verify.</p>
            </div>
          </div>
        </div>
        <ul className="divide-y divide-border">
          {SEO_FILES.map((file) => (
            <li key={file.path}>
              <a
                href={`${STOREFRONT_URL}${file.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-background transition-colors group"
              >
                <span className="flex-1 min-w-0">
                  <span className={`font-mono text-sm font-semibold ${file.color}`}>{file.label}</span>
                  <span className="block text-xs text-muted mt-0.5">{file.hint}</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  file.badge === "AI"  ? "bg-violet-100 text-violet-700" :
                  file.badge === "GMC" ? "bg-orange-100 text-orange-700" :
                  file.badge === "PIN" ? "bg-rose-100 text-rose-700" :
                                         "bg-slate-100 text-slate-600"
                }`}>
                  {file.badge}
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted group-hover:text-foreground transition-colors" />
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* ── 7. URL Redirects ──────────────────────────────────────────── */}
      <div id="redirects" className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border">
              <Link2 className="h-4 w-4 text-foreground" />
            </span>
            <div>
              <p className="font-semibold text-sm text-foreground">URL redirects</p>
              <p className="text-xs text-muted mt-0.5">Send old or broken links to the correct page (301 permanent or 302 temporary).</p>
            </div>
          </div>
        </div>

        {/* Add redirect form */}
        <form onSubmit={handleAddRedirect} className="border-b border-border px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
            <div>
              <label className="text-xs font-medium text-muted block mb-1">From path</label>
              <input
                required
                placeholder="/old-path"
                value={form.fromPath}
                onChange={(e) => setForm({ ...form, fromPath: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted block mb-1">To path / URL</label>
              <input
                required
                placeholder="/new-path"
                value={form.toPath}
                onChange={(e) => setForm({ ...form, toPath: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted block mb-1">Type</label>
              <select
                value={form.statusCode}
                onChange={(e) => setForm({ ...form, statusCode: Number(e.target.value) })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
              >
                <option value={301}>301 Permanent</option>
                <option value={302}>302 Temporary</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={savingRedirect}
                className="flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-surface hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                {savingRedirect ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        </form>

        {/* Redirects table */}
        {redirects.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            No redirects yet. Add one above to fix broken links.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-xs font-semibold text-muted uppercase tracking-wide">
                  <th className="px-5 py-3">From</th>
                  <th className="px-5 py-3">To</th>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {redirects.map((r) => (
                  <tr key={r._id} className="hover:bg-background/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-muted">{r.fromPath}</td>
                    <td className="px-5 py-3 font-mono text-xs">{r.toPath}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.statusCode === 301 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {r.statusCode}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteRedirect(r._id)}
                        className="rounded-lg p-1.5 text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Delete redirect"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
