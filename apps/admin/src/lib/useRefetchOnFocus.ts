import { useEffect, useRef } from "react";

/** Refetch when the user returns to the admin tab (e.g. after checking the storefront). */
export function useRefetchOnFocus(load: () => void) {
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    function onFocus() {
      loadRef.current();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
}
