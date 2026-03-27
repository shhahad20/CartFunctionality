export interface CartItem{
    productId: string;
    name: string;
    price: number;
    image?: string;
    quantity: number;
}
export interface Product{
    id: string;
    name: string;
    price: number;
    image?: string;
    description?: string;
    category?: string;
    stock?: number;
    createdAt?: string;
    updatedAt?: string;
}
export interface CartTotals{
    itemCount: number;
    subtotal: number;
    // tax: number;
    // total: number;
    // discount: number;
}
export interface Cart {
    userId: string;
    items: CartItem[];
    updatedAt?: Date;
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