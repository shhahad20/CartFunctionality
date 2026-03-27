// ─────────────────────────────────────────────────────────────────
// Shared Cart Types  (used by both frontend and backend)
// ─────────────────────────────────────────────────────────────────

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
    userId: string;
    items: CartItem[];
    updatedAt?: Date;
  }
  
  export interface CartTotals {
    itemCount: number;
    subtotal: number;
  }
  
  // ── API request / response shapes ─────────────────────────────────
  
  export interface AddItemRequest {
    productId: string;
    quantity?: number;
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