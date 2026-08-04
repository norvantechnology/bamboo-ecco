import { useState, useEffect } from "react";
import { Code2, Copy, Check, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { LastUpdatedAt } from "./LastUpdatedAt";
import { enrichJsonWithTimestamps } from "../lib/jsonTimestamps";

interface JsonEditorPanelProps {
  /** Current data object — will be serialised as pretty-printed JSON. */
  data: unknown;
  /** Called when the user clicks "Apply JSON" with the parsed object. */
  onApply: (parsed: any) => void;
  /** ISO timestamp or Date of the last save / last update. */
  lastUpdatedAt?: string | Date | null;
  /** Label shown in the panel header, e.g. "Product JSON". */
  label?: string;
  /** Mark the parent form as dirty after applying JSON. */
  onDirty?: () => void;
}

export function JsonEditorPanel({
  data,
  onApply,
  lastUpdatedAt,
  label = "JSON Editor",
  onDirty,
}: JsonEditorPanelProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  // Sync draft whenever the panel is opened or data changes while open
  useEffect(() => {
    if (open) {
      try {
        const enriched = enrichJsonWithTimestamps(data, lastUpdatedAt);
        setDraft(JSON.stringify(enriched, null, 2));
        setError("");
      } catch {
        setDraft("// Could not serialize data");
      }
    }
  }, [open, data, lastUpdatedAt]);

  function handleApply() {
    setError("");
    try {
      const parsed = JSON.parse(draft);
      onApply(parsed);
      onDirty?.();
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
    }
  }

  async function handleCopy() {
    try {
      const text = open
        ? draft
        : JSON.stringify(enrichJsonWithTimestamps(data, lastUpdatedAt), null, 2);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback — select the textarea
    }
  }

  function handleRefresh() {
    try {
      const enriched = enrichJsonWithTimestamps(data, lastUpdatedAt);
      setDraft(JSON.stringify(enriched, null, 2));
      setError("");
    } catch {
      setDraft("// Could not serialize data");
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-background/60 sm:px-5"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-200/40 text-violet-600">
          <Code2 className="h-4 w-4" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">{label}</span>
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-600 border border-violet-100">
              JSON
            </span>
          </span>
          <span className="block text-xs text-muted mt-0.5">
            Edit raw JSON to bulk-update all fields at once
          </span>
        </span>
        <LastUpdatedAt date={lastUpdatedAt} className="hidden sm:inline-flex" />
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
        )}
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-border px-4 py-4 space-y-3 sm:px-5">
          {/* Mobile: show last updated */}
          <div className="sm:hidden">
            <LastUpdatedAt date={lastUpdatedAt} />
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy JSON
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              ↻ Refresh from form
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleApply}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                applied
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-foreground text-surface hover:opacity-90"
              }`}
            >
              {applied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Applied!
                </>
              ) : (
                "Apply JSON"
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>Invalid JSON:</strong> {error}
              </span>
            </div>
          )}

          {/* Editor */}
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError("");
            }}
            spellCheck={false}
            className={`w-full rounded-xl border bg-background px-4 py-3 font-mono text-xs leading-relaxed outline-none transition-colors resize-y min-h-[200px] max-h-[600px] ${
              error
                ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200"
                : "border-border focus:border-violet-400 focus:ring-2 focus:ring-violet-200/40"
            }`}
            rows={16}
          />

          <p className="text-[10px] text-muted">
            Tip: Edit the JSON above and click <strong>Apply JSON</strong> to update all form fields. Then hit <strong>Save</strong> to persist.
          </p>
        </div>
      )}
    </section>
  );
}
