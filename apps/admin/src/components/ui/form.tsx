import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import * as React from "react";
import { cn } from "../../lib/utils";

export function Panel({
  id,
  title,
  children,
  action,
  className,
}: {
  id?: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-32 rounded-xl border border-border bg-surface", className)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function FieldRow({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 }) {
  const grid =
    cols === 1 ? "grid-cols-1" : cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return <div className={cn("grid gap-3", grid)}>{children}</div>;
}

type FieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function Field({ label, hint, children, className }: FieldProps) {
  return (
    <label className={cn("block text-sm", className)}>
      <span className="font-medium text-foreground">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all duration-200 hover:border-accent/40 focus:border-accent focus:ring-2 focus:ring-accent/30 shadow-sm";

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, "resize-y min-h-[100px]", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputClass, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}

export function SaveBar({
  onSave,
  saving,
  saved,
  label = "Save changes",
}: {
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  label?: string;
}) {
  return (
    <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface/95 px-5 py-4 shadow-xl backdrop-blur">
      <div className="flex items-center gap-2">
        <div className={cn("h-2 w-2 rounded-full", saved ? "bg-green-500" : "bg-amber-500 animate-pulse")} />
        <p className="text-sm font-medium text-muted">{saved ? "All changes saved" : "You have unsaved changes"}</p>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-semibold text-surface hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {saving ? "Saving…" : label}
      </button>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm border transition-all active:scale-[0.98]",
        checked 
          ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100" 
          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100",
      )}
    >
      <span
        className={cn("h-2.5 w-2.5 rounded-full transition-transform duration-200", checked ? "bg-emerald-600 scale-110" : "bg-gray-400")}
        aria-hidden
      />
      {label}
    </button>
  );
}

function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed}`.toLowerCase();
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

export function ColorInput({
  value,
  onChange,
  presets,
}: {
  value: string;
  onChange: (hex: string) => void;
  presets?: string[];
}) {
  const safeValue = normalizeHexColor(value) ?? "#000000";
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  function commitDraft() {
    const normalized = normalizeHexColor(draft);
    if (normalized) {
      onChange(normalized);
      setDraft(normalized);
      return;
    }
    setDraft(safeValue);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safeValue}
          onChange={(e) => {
            onChange(e.target.value);
            setDraft(e.target.value);
          }}
          className="h-10 w-11 shrink-0 cursor-pointer rounded-lg border border-border bg-background p-1"
          aria-label="Pick colour"
        />
        <TextInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            }
          }}
          placeholder="#5c6b52"
          className="font-mono text-xs uppercase"
          spellCheck={false}
        />
      </div>
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => {
                onChange(color);
                setDraft(color);
              }}
              className={cn(
                "h-7 w-7 rounded-md border-2 shadow-sm transition-transform hover:scale-105",
                safeValue === color ? "border-foreground" : "border-border/60",
              )}
              style={{ backgroundColor: color }}
              aria-label={`Use colour ${color}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
