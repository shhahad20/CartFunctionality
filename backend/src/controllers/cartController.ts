import type { Cart, CartItem, AddItemRequest } from "../types.js";

// ─── Storage interface ────────────────────────────────────────────

export interface CartStore {
  get(userId: string): Promise<Cart>;
  save(userId: string, cart: Cart): Promise<Cart>;
  delete(userId: string): Promise<void>;
}

// ─── In-memory adapter ────────────────────────────────────────────

export class InMemoryCartStore implements CartStore {
  private store = new Map<string, Cart>();

  async get(userId: string): Promise<Cart> {
    return this.store.get(userId) ?? { userId, items: [] };
  }

  async save(userId: string, cart: Cart): Promise<Cart> {
    const updated = { ...cart, updatedAt: new Date() };
    this.store.set(userId, updated);
    return updated;
  }

  async delete(userId: string): Promise<void> {
    this.store.delete(userId);
  }
}

// ─── MongoDB adapter stub ─────────────────────────────────────────

export class MongoCartStore implements CartStore {
  private col: any; // replace with: Collection<Cart> from 'mongodb'

  constructor(db: any) {
    this.col = db.collection("carts");
  }

  async get(userId: string): Promise<Cart> {
    const doc = await this.col.findOne({ userId });
    return doc ?? { userId, items: [] };
  }

  async save(userId: string, cart: Cart): Promise<Cart> {
    const updated = { ...cart, updatedAt: new Date() };
    await this.col.updateOne(
      { userId },
      { $set: updated },
      { upsert: true }
    );
    return updated;
  }

  async delete(userId: string): Promise<void> {
    await this.col.deleteOne({ userId });
  }
}

// ─── Redis adapter stub ───────────────────────────────────────────

export class RedisCartStore implements CartStore {
  private readonly ttl: number;

  constructor(
    private client: any, // replace with RedisClientType from 'redis'
    ttl = 60 * 60 * 24 * 7 // 7 days
  ) {
    this.ttl = ttl;
  }

  private key(userId: string): string {
    return `cart:${userId}`;
  }

  async get(userId: string): Promise<Cart> {
    const raw = await this.client.get(this.key(userId));
    return raw ? (JSON.parse(raw) as Cart) : { userId, items: [] };
  }

  async save(userId: string, cart: Cart): Promise<Cart> {
    const updated = { ...cart, updatedAt: new Date() };
    await this.client.set(this.key(userId), JSON.stringify(updated), {
      EX: this.ttl,
    });
    return updated;
  }

  async delete(userId: string): Promise<void> {
    await this.client.del(this.key(userId));
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
    { productId, quantity = 1 }: AddItemRequest
  ): Promise<Cart> {
    const cart = await this.store.get(cartId);
    const idx = cart.items.findIndex((i) => i.productId === productId);

    console.log(`🙋🏼‍♀️Adding ${quantity} of ${productId} to cart ${cartId}`);

    if (idx >= 0) {
      cart.items[idx].quantity += quantity;
    } else {
      // Optionally enrich item from a ProductService here
      cart.items.push({ productId, name: productId, price: 0, quantity });
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
    quantity: number
  ): Promise<Cart> {
    if (quantity < 1) return this.removeItem(cartId, productId);

    const cart = await this.store.get(cartId);
    const item = cart.items.find((i) => i.productId === productId);
    if (item) item.quantity = quantity;
    return this.store.save(cartId, cart);
  }

  async clearCart(cartId: string): Promise<void> {
    return this.store.delete(cartId);
  }

  async mergeGuestCart(
    userId: string,
    guestItems: CartItem[]
  ): Promise<Cart> {
    const cart = await this.store.get(userId);

    for (const guestItem of guestItems) {
      const idx = cart.items.findIndex(
        (i) => i.productId === guestItem.productId
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