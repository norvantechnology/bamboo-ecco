import { useState, useEffect } from "react";
import { Code2, Copy, Check, AlertCircle, X, Sparkles } from "lucide-react";
import { LastUpdatedAt } from "./LastUpdatedAt";
import { enrichJsonWithTimestamps } from "../lib/jsonTimestamps";

interface JsonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current data object — will be serialised as pretty-printed JSON. */
  data: unknown;
  /** Called when the user clicks "Apply JSON" with the parsed object. */
  onApply?: (parsed: any) => void;
  /** ISO timestamp or Date of the last save / last update. */
  lastUpdatedAt?: string | Date | null;
  /** Label shown in the modal header, e.g. "Product JSON". */
  label?: string;
  /** Mark the parent form as dirty after applying JSON. */
  onDirty?: () => void;
  readOnly?: boolean;
}

export function JsonEditorModal({
  isOpen,
  onClose,
  data,
  onApply,
  lastUpdatedAt,
  label = "JSON Editor",
  onDirty,
  readOnly = false,
}: JsonEditorModalProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        const enriched = enrichJsonWithTimestamps(data, lastUpdatedAt);
        setDraft(JSON.stringify(enriched, null, 2));
        setError("");
      } catch {
        setDraft("// Could not serialize data");
      }
    }
  }, [isOpen, data, lastUpdatedAt]);

  if (!isOpen) return null;

  function handleApply() {
    if (readOnly || !onApply) return;
    setError("");
    try {
      const parsed = JSON.parse(draft);
      onApply(parsed);
      onDirty?.();
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON format");
    }
  }

  function handleFormat() {
    try {
      const parsed = JSON.parse(draft);
      setDraft(JSON.stringify(parsed, null, 2));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON format");
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-background/50">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-300/40 text-violet-600 dark:text-violet-400">
              <Code2 className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground">{label}</h3>
                <span className="rounded-full bg-violet-100 dark:bg-violet-950/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  {readOnly ? "JSON View" : "Direct Edit"}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                {readOnly ? "View raw JSON structure" : "Edit raw JSON to update form fields instantly"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LastUpdatedAt date={lastUpdatedAt} className="hidden sm:inline-flex" />
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-muted hover:text-foreground hover:bg-background transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 border-b border-border bg-surface">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted" />
                  Copy JSON
                </>
              )}
            </button>

            {!readOnly && (
              <>
                <button
                  type="button"
                  onClick={handleFormat}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Format JSON
                </button>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground hover:bg-surface transition-colors"
                >
                  ↻ Reset from form
                </button>
              </>
            )}
          </div>

          <LastUpdatedAt date={lastUpdatedAt} className="sm:hidden" />
        </div>

        {/* Validation error */}
        {error && (
          <div className="mx-6 mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <span>
              <strong>Syntax Error:</strong> {error}
            </span>
          </div>
        )}

        {/* Editor text area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <textarea
            value={draft}
            readOnly={readOnly}
            onChange={(e) => {
              setDraft(e.target.value);
              setError("");
            }}
            spellCheck={false}
            className={`w-full h-full min-h-[300px] rounded-xl border bg-background p-4 font-mono text-xs leading-relaxed outline-none transition-colors ${
              error
                ? "border-red-400 focus:ring-2 focus:ring-red-200"
                : "border-border focus:border-violet-400 focus:ring-2 focus:ring-violet-200/40"
            }`}
            rows={20}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-background/50">
          <p className="text-xs text-muted">
            {readOnly
              ? "Read-only preview of component state."
              : "Click Apply JSON to populate form fields, then save."}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface transition-colors"
            >
              Close
            </button>
            {!readOnly && onApply && (
              <button
                type="button"
                onClick={() => {
                  handleApply();
                  if (!error) {
                    setTimeout(() => onClose(), 400);
                  }
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold shadow-md transition-all ${
                  applied
                    ? "bg-emerald-600 text-white"
                    : "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-95"
                }`}
              >
                {applied ? (
                  <>
                    <Check className="h-4 w-4" /> Applied to form!
                  </>
                ) : (
                  "Apply & Update JSON"
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

interface JsonEditorButtonProps {
  data: unknown;
  onApply?: (parsed: any) => void;
  lastUpdatedAt?: string | Date | null;
  label?: string;
  onDirty?: () => void;
  readOnly?: boolean;
  className?: string;
}

export function JsonEditorButton({
  data,
  onApply,
  lastUpdatedAt,
  label = "JSON Editor",
  onDirty,
  readOnly = false,
  className = "",
}: JsonEditorButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 rounded-xl border border-violet-300/60 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-violet-700 hover:from-violet-500/20 hover:to-indigo-500/20 dark:border-violet-700/50 dark:text-violet-300 shadow-sm transition-all active:scale-[0.98] ${className}`}
        title="Open JSON Editor Modal"
      >
        <Code2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        <span>JSON Editor</span>
      </button>

      <JsonEditorModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        data={data}
        onApply={onApply}
        lastUpdatedAt={lastUpdatedAt}
        label={label}
        onDirty={onDirty}
        readOnly={readOnly}
      />
    </>
  );
}
