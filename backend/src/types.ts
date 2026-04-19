// ─────────────────────────────────────────────────────────────────
// Shared Cart Types  (used by both frontend and backend)
// ─────────────────────────────────────────────────────────────────
export const ORDER_STATUS_LABELS = {
  pending: "Pending",
  in_review: "In Review",
  processing: "Processing",
  shipped: "Shipped",
  completed: "Completed",
  canceled: "Canceled",
};
export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

export interface Cart {
  id: string;
  userId?: string | null;
  items: CartItem[];
  // updatedAt?: Date;
  updatedAt: Date;
  createdAt?: Date;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
}

// ── API request / response shapes ─────────────────────────────────

export interface AddItemRequest {
  productId: string;
  quantity: number;
  name?: string;
  price?: number;
}

export interface UpdateQuantityRequest {
  quantity: number;
}

export interface CartResponse {
  items: CartItem[];
}

export interface ApiError {
  error: string;
}
