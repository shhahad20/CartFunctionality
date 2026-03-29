import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import type { CartItem, CartTotals, Product } from "../types/types";

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}
const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
};

type CartAction =
  | { type: "SET_CART"; payload: CartItem[] }
  | { type: "ADD_TO_CART"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | {
      type: "UPDATE_QUANTITY";
      payload: { productId: string; quantity: number };
    }
  | { type: "CLEAR_CART" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string };

// const CartContext = createContext(null); // null is a default value for the context

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "SET_CART":
      return { ...state, items: action.payload, loading: false };

    case "ADD_TO_CART": {
      const existingItems = state.items.find(
        (i) => i.productId === action.payload.productId,
      );

      const items = existingItems
        ? state.items.map((i) =>
            i.productId === action.payload.productId
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i,
          )
        : [...state.items, action.payload];
      return { ...state, items };
    }
    case "REMOVE_ITEM": {
      return {
        ...state,
        items: state.items.filter((i) => i.productId !== action.payload),
      };
    }
    case "UPDATE_QUANTITY": {
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.payload.productId
            ? { ...i, quantity: action.payload.quantity }
            : i,
        ),
      };
    }
    case "CLEAR_CART": {
      return { ...state, items: [] };
    }
    case "SET_LOADING": {
      return { ...state, loading: action.payload };
    }
    case "SET_ERROR": {
      return { ...state, error: action.payload, loading: false };
    }
    default:
      return state;
  }
};

interface CartContextValue extends CartState, CartTotals {
  fetchCart: () => Promise<void>;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  checkout: (email: string) => Promise<void>;
}
const CartContext = createContext<CartContextValue | null>(null);

//__________________________________Provider Component_____________________________________//
function getGuestId(): string {
  let guestId = localStorage.getItem("guestId");

  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem("guestId", guestId);
    console.log("🆕 New guestId created:", guestId);
  } else {
    console.log("♻️ Existing guestId:", guestId);
  }

  return guestId;
}

interface CartProviderProps {
  children: React.ReactNode;
  apiBase?: string;
  userId?: string | null;
}

export function CartProvider({
  children,
  apiBase = "http://localhost:5173/api",
  userId = null,
}: CartProviderProps) {
  const [cartId, setCartId] = useState<string | null>(null);

  useEffect(() => {
    const id = userId ?? getGuestId();
    console.log("🚀 Cart initialized with ID:", id);
    setCartId(id);
  }, [userId]);

  const [state, dispatch] = useReducer(cartReducer, initialState);

  const headers: HeadersInit | null = useMemo(() => {
    if (!cartId) return null;

    return {
      "Content-Type": "application/json",
      "x-cart-id": cartId,
    };
  }, [cartId]);
  // Headers only change when cartId changes.

  // Dependency chain: cartId → headers → fetchCart

  const fetchCart = useCallback(async (): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      if (!headers) return;
      const res = await fetch(`${apiBase}`, { headers });
      const data = await res.json();
      dispatch({ type: "SET_CART", payload: data.items });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: (err as Error).message });
    }
  }, [apiBase, headers]);

  useEffect(() => {
    if (!headers) return;
    fetchCart();
  }, [headers, fetchCart]);

const checkout = useCallback(async (email: string): Promise<void> => {
  try {
    if (!cartId) throw new Error("Cart not initialized");

    const res = await fetch(`${apiBase}/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cart-id": cartId,
      },
      body: JSON.stringify({ cartId, email }),
    });

    if (!res.ok) {
      throw new Error(`Checkout failed (${res.status})`);
    }

    const data: { url: string } = await res.json();

    if (!data.url) {
      throw new Error("Missing Stripe URL");
    }

    // redirect to Stripe
    window.location.href = data.url;
  } catch (error) {
    console.error("Checkout error:", error);
  }
}, [apiBase, cartId]);

  const addItem = useCallback(
    async (product: Product, quantity = 1): Promise<void> => {
      const optimistic: CartItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
      };
      dispatch({ type: "ADD_TO_CART", payload: optimistic });
      try {
        if (!headers) return;
        const res = await fetch(`${apiBase}/items`, {
          method: "POST",
          headers,
          body: JSON.stringify({ productId: product.id, quantity }),
        });
        if (!res.ok) throw new Error(`Failed to add item (${res.status})`);
        const data = (await res.json()) as { items: CartItem[] };

        console.log(data + "data from addItem");

        dispatch({ type: "SET_CART", payload: data.items });
      } catch (err) {
        dispatch({ type: "SET_ERROR", payload: (err as Error).message });
        fetchCart();
      }
    },
    [apiBase, headers],
  );
  const removeItem = useCallback(
    async (productId: string): Promise<void> => {
      dispatch({ type: "REMOVE_ITEM", payload: productId });
      try {
        if (!headers) return;
        const res = await fetch(`${apiBase}/items/${productId}`, {
          method: "DELETE",
          headers,
        });
        if (!res.ok) throw new Error(`Failed to remove item (${res.status})`);
        const data = (await res.json()) as { items: CartItem[] };
        dispatch({ type: "SET_CART", payload: data.items });
      } catch (err) {
        dispatch({ type: "SET_ERROR", payload: (err as Error).message });
        fetchCart();
      }
    },
    [apiBase, headers],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number): Promise<void> => {
      if (quantity < 1) return removeItem(productId);
      dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } });
      try {
        if (!headers) return;
        const res = await fetch(`${apiBase}/items/${productId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ quantity }),
        });
        if (!res.ok) throw new Error(`Failed to update item (${res.status})`);
        const data = (await res.json()) as { items: CartItem[] };
        dispatch({ type: "SET_CART", payload: data.items });
      } catch (err) {
        dispatch({ type: "SET_ERROR", payload: (err as Error).message });
        fetchCart();
      }
    },
    [apiBase, headers, removeItem, fetchCart],
  );

  const clearCart = useCallback(async (): Promise<void> => {
    dispatch({ type: "CLEAR_CART" });
    try {
      if (!headers) return;
      await fetch(`${apiBase}`, { method: "DELETE", headers });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: (err as Error).message });
      fetchCart();
    }
  }, [apiBase, headers, fetchCart]);

  const totals: CartTotals = useMemo(
    () => ({
      itemCount: state.items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    [state.items],
  ); // totals only recompute when items change.

  const value = useMemo(
    () => ({
      ...state,
      ...totals,
      fetchCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      checkout,
    }),
    [
      state,
      totals,
      fetchCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      checkout,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
