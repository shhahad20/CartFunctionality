import { supabase } from "../config/supabaseClient.js";
import type { Cart, CartItem, AddItemRequest } from "../types.js";
import { getProductById } from "./productController.js";

// ─── Storage interface ────────────────────────────────────────────
export interface CartStore {
  get(cartId: string): Promise<Cart | null>;
  save(cartId: string, cart: Cart): Promise<Cart>;
  delete(cartId: string): Promise<void>;
}

// ─── In-memory adapter ────────────────────────────────────────────
const CART_TTL = 1000 * 60 * 60 * 24; // 24h
export class SupabaseCartStore implements CartStore {
  async get(cartId: string): Promise<Cart | null> {
    const { data, error } = await supabase
      .from("carts")
      .select("*")
      .eq("id", cartId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return null;
    }

    const cart: Cart = {
      id: data.id,
      items: data.items ?? [],
      updatedAt: new Date(data.updated_at),
    };

    const isExpired = Date.now() - cart.updatedAt.getTime() > CART_TTL;

    if (isExpired) {
      return {
        id: cartId,
        items: [],
        updatedAt: new Date(),
      };
    }

    return cart;
  }

  async save(cartId: string, cart: Cart): Promise<Cart> {
    cart.updatedAt = new Date();

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

  async getCart(cartId: string): Promise<Cart | null> {
    return this.store.get(cartId);
  }

  async addItem(
    cartId: string,
    { productId, quantity = 1 }: AddItemRequest,
  ): Promise<Cart> {
    let cart = await this.store.get(cartId);

    // CREATE ONLY HERE
    if (!cart) {
      cart = {
        id: cartId,
        items: [],
        updatedAt: new Date(),
      };
    }

    const product = await getProductById(productId);

    const idx = cart.items.findIndex((i) => i.productId === productId);

    if (idx >= 0) {
      cart.items[idx].quantity += quantity;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
      });
    }

    return this.store.save(cartId, cart);
  }

  async removeItem(cartId: string, productId: string): Promise<Cart> {
    const cart = await this.store.get(cartId);

    if (!cart) {
      return {
        id: cartId,
        items: [],
        updatedAt: new Date(),
      };
    }
    cart.items = cart.items.filter((i) => i.productId !== productId);
    return this.store.save(cartId, cart);
  }

  async updateQuantity(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<Cart> {
    if (quantity == null || quantity < 1)
      return this.removeItem(cartId, productId);

    const cart = (await this.store.get(cartId)) ?? {
      id: cartId,
      items: [],
      updatedAt: new Date(),
    };
    const item = cart.items.find((i) => i.productId === productId);
    if (item) item.quantity = quantity;
    return this.store.save(cartId, cart);
  }

  async clearCart(cartId: string): Promise<void> {
    await this.store.save(cartId, {
      id: cartId,
      items: [],
      updatedAt: new Date(),
    });
  }

  async mergeGuestCart(userId: string, guestItems: CartItem[]): Promise<Cart> {
    let cart = await this.store.get(userId);

    if (!cart) {
      cart = {
        id: userId,
        items: [],
        updatedAt: new Date(),
      };
    }

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
