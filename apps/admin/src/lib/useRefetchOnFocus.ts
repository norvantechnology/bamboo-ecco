import { useEffect, useRef } from "react";

type Options = {
  /** When false, skip refetch (e.g. form has unsaved edits). */
  enabled?: boolean;
};

/**
 * Refetch when the user returns to the admin tab (e.g. after checking the storefront).
 * Skips while `enabled` is false so focus after uploads / alt-tab does not wipe drafts.
 */
export function useRefetchOnFocus(load: () => void, options: Options = {}) {
  const loadRef = useRef(load);
  loadRef.current = load;
  const enabledRef = useRef(options.enabled !== false);
  enabledRef.current = options.enabled !== false;

  useEffect(() => {
    function onFocus() {
      if (!enabledRef.current) return;
      loadRef.current();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
}
