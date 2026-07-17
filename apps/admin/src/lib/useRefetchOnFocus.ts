import { useEffect, useRef } from "react";

type Options = {
  /** When false, skip refetch (e.g. form has unsaved edits). */
  enabled?: boolean;
  /** Sync lock — checked on focus so file-picker blur/focus cannot wipe uploads. */
  isLocked?: () => boolean;
};

/**
 * Refetch when the user returns to the admin tab (e.g. after checking the storefront).
 * Skips while `enabled` is false or `isLocked()` is true so focus after uploads
 * / file picker does not wipe drafts.
 */
export function useRefetchOnFocus(load: () => void, options: Options = {}) {
  const loadRef = useRef(load);
  loadRef.current = load;
  const enabledRef = useRef(options.enabled !== false);
  enabledRef.current = options.enabled !== false;
  const isLockedRef = useRef(options.isLocked);
  isLockedRef.current = options.isLocked;

  useEffect(() => {
    function onFocus() {
      if (!enabledRef.current) return;
      if (isLockedRef.current?.()) return;
      loadRef.current();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
}
