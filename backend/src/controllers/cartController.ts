import { supabase } from "../config/supabaseClient.js";
import type { Cart, CartItem, AddItemRequest } from "../types.js";
import { getProductById } from "./productController.js";

// ─── Storage interface ────────────────────────────────────────────
export interface CartStore {
  get(cartId: string): Promise<Cart>;
  save(cartId: string, cart: Cart): Promise<Cart>;
  delete(cartId: string): Promise<void>;
}

// ─── In-memory adapter ────────────────────────────────────────────
const CART_TTL = 1000 * 60 * 60 * 24; // 24h
export class SupabaseCartStore implements CartStore {
  async get(cartId: string): Promise<Cart> {
    const { data, error } = await supabase
      .from("carts")
      .select("*")
      .eq("id", cartId)
      .maybeSingle();

    if (!data) {
      const newCart: Cart = {
        id: cartId,
        items: [],
        // 🔺🔺 Check this timestamp later 🔺🔺
        updatedAt: Date.now(), // the filed in the db is "updated_at" but we map it to "updatedAt" in the Cart interface
      };

      await this.save(cartId, newCart);
      return newCart;
    }

    let cart: Cart = {
      id: data.id,
      items: data.items,
      updatedAt: data.updated_at,
    };

    const isExpired = Date.now() - cart.updatedAt > CART_TTL;

    if (isExpired) {
      cart = { id: cartId, items: [], updatedAt: Date.now() };
      await this.save(cartId, cart);
    }

    return cart;
  }

  async save(cartId: string, cart: Cart): Promise<Cart> {
    cart.updatedAt = Date.now();

    const { error } = await supabase.from("carts").upsert({
      id: cartId,
      items: cart.items,
      updated_at: cart.updatedAt,
    });

    if (error) throw error;

    return cart;
  }

  async delete(cartId: string): Promise<void> {
    const { error } = await supabase.from("carts").delete().eq("id", cartId);

    if (error) throw error;
  }
}

// ─── CartService ──────────────────────────────────────────────────

export class CartService {
  constructor(private readonly store: CartStore) {}

  async getCart(cartId: string): Promise<Cart> {
    return this.store.get(cartId);
  }

  async addItem(
    cartId: string,
    { productId, quantity = 1 }: AddItemRequest,
  ): Promise<Cart> {
    const cart = await this.store.get(cartId);
    const idx = cart.items.findIndex((i) => i.productId === productId);

    // 🔒 fetch real product from DB
    const product = await getProductById(productId);

    if (idx >= 0) {
      cart.items[idx].quantity += quantity;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        price: product.price, // ✅ trusted
        image: product.image,
        quantity,
      });
    }

    return this.store.save(cartId, cart);
  }

  async removeItem(cartId: string, productId: string): Promise<Cart> {
    const cart = await this.store.get(cartId);
    cart.items = cart.items.filter((i) => i.productId !== productId);
    return this.store.save(cartId, cart);
  }

  async updateQuantity(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart> {
    if (quantity == null || quantity < 1) return this.removeItem(cartId, productId);

    const cart = await this.store.get(cartId);
    const item = cart.items.find((i) => i.productId === productId);
    if (item) item.quantity = quantity;
    return this.store.save(cartId, cart);
  }

  async clearCart(cartId: string): Promise<void> {
    await this.store.save(cartId, {
    id: cartId,
    items: [],
    updatedAt: Date.now(),
  });
  }

  async mergeGuestCart(userId: string, guestItems: CartItem[]): Promise<Cart> {
    const cart = await this.store.get(userId);

    for (const guestItem of guestItems) {
      const idx = cart.items.findIndex(
        (i) => i.productId === guestItem.productId,
      );
      if (idx >= 0) {
        cart.items[idx].quantity += guestItem.quantity;
      } else {
        cart.items.push(guestItem);
      }
    }

    return this.store.save(userId, cart);
  }
}

// ─── CartService ──────────────────────────────────────────────────
