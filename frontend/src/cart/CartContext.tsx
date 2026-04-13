import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  // useState,
} from "react";
import type { CartItem, CartTotals, Product } from "../types/types";
import { handleResponse } from "../helper/errorHelper";

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
  checkout: () => Promise<void>;
}
const CartContext = createContext<CartContextValue | null>(null);

//__________________________________Provider Component_____________________________________//
interface CartProviderProps {
  children: React.ReactNode;
  apiBase?: string;
  userId?: string | null;
}

export function CartProvider({
  children,
  apiBase = "http://localhost:5173/api",
  // userId = null,
}: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const fetchCart = useCallback(async (): Promise<void> => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await fetch(`${apiBase}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await handleResponse(res);

      dispatch({ type: "SET_CART", payload: data.items ?? [] });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: (err as Error).message });
    }
  }, [apiBase]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const checkout = useCallback(
    async (): Promise<void> => {
      try {
        const res = await fetch(`${apiBase}/checkout`, {
          method: "POST",
          credentials: "include",
        });
        const data = await handleResponse(res);
        if (!data.url) {
          throw new Error("Missing Stripe URL");
        }
        // redirect to Stripe
        window.location.href = data.url;
      } catch (error) {
        console.error("Checkout error:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Checkout failed. Please try again.",
        });
      }
    },
    [apiBase],
  );

  const addItem = useCallback(
    async (product: Product, quantity = 1): Promise<void> => {

      if (state.loading) return;

      const optimistic: CartItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
      };

      dispatch({ type: "ADD_TO_CART", payload: optimistic });
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const res = await fetch(`${apiBase}/items`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ productId: product.id, quantity }),
        });

        const data = (await handleResponse(res));

        dispatch({ type: "SET_CART", payload: data.items ?? [] });
      } catch (err) {
        dispatch({ type: "SET_ERROR", payload: (err as Error).message });
        fetchCart();
      }
    },
    [apiBase, fetchCart, state.loading],
  );

  const removeItem = useCallback(
    async (productId: string): Promise<void> => {
      if (state.loading) return;

      dispatch({ type: "REMOVE_ITEM", payload: productId });
      try {
        const res = await fetch(`${apiBase}/items/${productId}`, {
          method: "DELETE",
          credentials: "include",
        });

        const data = (await handleResponse(res));

        dispatch({ type: "SET_CART", payload: data.items ?? [] });
      } catch (err) {
        dispatch({ type: "SET_ERROR", payload: (err as Error).message });
        fetchCart();
      }
    },
    [apiBase, fetchCart, state.loading],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number): Promise<void> => {
      if (state.loading) return;
      if (quantity < 1) return removeItem(productId);
      dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } });
      try {
        const res = await fetch(`${apiBase}/items/${productId}`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quantity }),
        });

        const data = (await handleResponse(res));
        dispatch({ type: "SET_CART", payload: data.items ?? [] });
      } catch (err) {
        dispatch({ type: "SET_ERROR", payload: (err as Error).message });
        fetchCart();
      }
    },
    [apiBase, removeItem, fetchCart, state.loading],
  );

  const clearCart = useCallback(async (): Promise<void> => {
    if (state.loading) return;
    dispatch({ type: "CLEAR_CART" });
    try {
      const res = await fetch(`${apiBase}`, {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: (err as Error).message });
      fetchCart();
    }
  }, [apiBase, fetchCart, state.loading]);

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
