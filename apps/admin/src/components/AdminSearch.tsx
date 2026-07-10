import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { filterNavItems } from "../lib/admin-nav";

export function AdminSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const results = filterNavItems(query);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function go(to: string) {
    navigate(to);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          placeholder="Find a page…"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="h-9 w-full rounded-lg border border-border bg-background py-0 pl-9 pr-3 text-sm outline-none transition-shadow duration-150 focus:ring-2 focus:ring-accent"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-muted">No pages match “{query}”</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <button
                      type="button"
                      onClick={() => go(item.to)}
                      className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-background"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                      <span>
                        <span className="block text-sm font-medium">{item.label}</span>
                        <span className="block text-xs text-muted">{item.description}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
