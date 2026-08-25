"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface CartItem {
  slug: string;
  name: string;
  /** Display subtitle, e.g. "12V 45Ah LiFePO4" */
  battery: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  /** True once the cart has been loaded from localStorage. */
  hydrated: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const STORAGE_KEY = "sunvolt:cart";

const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CartItem =>
        typeof x?.slug === "string" &&
        typeof x?.name === "string" &&
        typeof x?.price === "number" &&
        Number.isInteger(x?.quantity) &&
        x.quantity >= 1 &&
        x.quantity <= 10,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable — cart lives for the session only
    }
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((x) => x.slug === item.slug);
        if (existing) {
          return prev.map((x) =>
            x.slug === item.slug
              ? { ...x, quantity: Math.min(10, x.quantity + quantity) }
              : x,
          );
        }
        return [...prev, { ...item, quantity: Math.min(10, quantity) }];
      });
    },
    [],
  );

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((x) => x.slug !== slug)
        : prev.map((x) =>
            x.slug === slug ? { ...x, quantity: Math.min(10, quantity) } : x,
          ),
    );
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((x) => x.slug !== slug));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const { totalItems, subtotal } = useMemo(() => {
    return {
      totalItems: items.reduce((sum, x) => sum + x.quantity, 0),
      subtotal: items.reduce((sum, x) => sum + x.price * x.quantity, 0),
    };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      hydrated,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      totalItems,
      subtotal,
    }),
    [items, hydrated, addItem, setQuantity, removeItem, clearCart, totalItems, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
