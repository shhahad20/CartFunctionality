import { supabase } from "../config/supabaseClient.js";
import type { Cart, CartItem, AddItemRequest } from "../types.js";
import { getProductById } from "./productController.js";

// ─── Storage interface ────────────────────────────────────────────
export interface CartStore {
  get(cartId: string): Promise<Cart | null>;
  save(cartId: string, cart: Cart, userId?: string): Promise<Cart>;
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

  async save(cartId: string, cart: Cart, userId?: string): Promise<Cart> {
    cart.updatedAt = new Date();

    const { error } = await supabase.from("carts").upsert({
      id: cartId,
      items: cart.items,
      updated_at: cart.updatedAt,
      user_id: userId ?? null,
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

  private mergeItems(userItems: CartItem[], guestItems: CartItem[]) {
  const map = new Map<string, CartItem>();

  for (const item of [...userItems, ...guestItems]) {
    if (map.has(item.productId)) {
      map.get(item.productId)!.quantity += item.quantity;
    } else {
      map.set(item.productId, { ...item });
    }
  }

  return Array.from(map.values());
}

  async getCart(cartId: string): Promise<Cart | null> {
    return this.store.get(cartId);
  }

  async addItem(
    cartId: string,
    { productId, quantity = 1 }: AddItemRequest,
    userId?: string,
  ): Promise<Cart> {
    let cart = await this.store.get(cartId);

    // CREATE ONLY HERE
    if (!cart) {
      console.log("Creating new cart: cartId =", cartId, "userId =", userId); // 🔺TO BE DELETED LATER🔺
      cart = {
        id: cartId,
        items: [],
        updatedAt: new Date(),
        userId: userId ?? null,
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

    return this.store.save(cartId, cart, userId);
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

  async mergeGuestCartToUser(
  guestCartId: string,
  userId: string,
): Promise<Cart> {
  const guestCart = await this.store.get(guestCartId);

  // 1. Get user cart (by user_id)
  const { data: existingUserCart } = await supabase
    .from("carts")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // 2. If no guest cart → just return existing
  if (!guestCart) {
    if (existingUserCart) {
      return {
        id: existingUserCart.id,
        items: existingUserCart.items ?? [],
        updatedAt: new Date(existingUserCart.updated_at),
        userId,
      };
    }

    // no carts at all → create one
    const newCart: Cart = {
      id: crypto.randomUUID(),
      items: [],
      updatedAt: new Date(),
      userId,
    };

    return this.store.save(newCart.id, newCart);
  }

  // 3. If user has NO cart → assign guest cart
  if (!existingUserCart) {
    guestCart.userId = userId;
    return this.store.save(guestCartId, guestCart);
  }

  // 4. Merge items
  const mergedItems = this.mergeItems(
    existingUserCart.items ?? [],
    guestCart.items ?? [],
  );

  const updatedCart: Cart = {
    id: existingUserCart.id,
    items: mergedItems,
    updatedAt: new Date(),
    userId,
  };

  await this.store.save(existingUserCart.id, updatedCart);

  // 5. Delete guest cart
  await this.store.delete(guestCartId);

  return updatedCart;
}
}

export async function mergeOrAssignCart(
  guestCartId: string,
  userId: string
): Promise<{ canonicalCartId: string; merged: boolean }> {
  // ── 1. Fetch the guest/incoming cart ──────────────────────────────────────
  const { data: incomingCart, error: fetchError } = await supabase
    .from("carts")
    .select("*")
    .eq("id", guestCartId)
    .single();

  if (fetchError || !incomingCart) {
    throw new Error(`Cart not found: ${guestCartId}`);
  }

  // ── 2. Already owned by this user — nothing to do ─────────────────────────
  if (incomingCart.user_id === userId) {
    return { canonicalCartId: guestCartId, merged: false };
  }

  // ── 3. Belongs to a different user — ownership violation ──────────────────
  if (incomingCart.user_id !== null) {
    throw new Error("Cart belongs to another user");
  }

  // ── 4. Guest cart (user_id = null) ────────────────────────────────────────
  const { data: existingUserCart } = await supabase
    .from("carts")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  // ── 4a. No existing user cart → simply assign ownership ───────────────────
  if (!existingUserCart) {
    const { error: assignError } = await supabase
      .from("carts")
      .update({ user_id: userId })
      .eq("id", guestCartId)
      .is("user_id", null); // extra guard: only update if still null (race condition safety)

    if (assignError) {
      throw new Error(`Failed to assign guest cart: ${assignError.message}`);
    }

    return { canonicalCartId: guestCartId, merged: false };
  }

  // ── 4b. User already has a cart → merge items, delete guest cart ──────────
  const mergedItems = mergeItems(
    existingUserCart.items ?? [],
    incomingCart.items ?? []
  );

  const { error: updateError } = await supabase
    .from("carts")
    .update({ items: mergedItems })
    .eq("id", existingUserCart.id);

  if (updateError) {
    throw new Error(`Failed to merge cart items: ${updateError.message}`);
  }

  // Delete the now-redundant guest cart
  await supabase.from("carts").delete().eq("id", guestCartId);

  return { canonicalCartId: existingUserCart.id, merged: true };
}

/**
 * Combines two item arrays, summing quantities for duplicate productIds.
 */
function mergeItems(base: CartItem[], incoming: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();

  for (const item of base) {
    map.set(item.productId, { ...item });
  }

  for (const item of incoming) {
    const existing = map.get(item.productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      map.set(item.productId, { ...item });
    }
  }

  return Array.from(map.values());
}