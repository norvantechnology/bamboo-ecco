"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface WishlistItem {
  productId: string;
  sku: string;
  slug: string;
  title: string;
  image: string;
  price: number;
}

interface WishlistContextValue {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  removeItem: (productId: string, sku: string) => void;
  isWishlisted: (productId: string, sku: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "ecoo_wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as WishlistItem[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const isWishlisted = useCallback(
    (productId: string, sku: string) => items.some((i) => i.productId === productId && i.sku === sku),
    [items],
  );

  const toggle = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.productId === item.productId && i.sku === item.sku);
      if (exists) return prev.filter((i) => !(i.productId === item.productId && i.sku === item.sku));
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((productId: string, sku: string) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.sku === sku)));
  }, []);

  const value = useMemo(
    () => ({ items, toggle, removeItem, isWishlisted }),
    [items, toggle, removeItem, isWishlisted],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
