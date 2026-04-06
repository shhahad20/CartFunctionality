import jwt from "jsonwebtoken";

const CART_SECRET = process.env.CART_SECRET!;

export function signCartToken(cartId: string): string {
  return jwt.sign({ cartId, type: "cart" }, CART_SECRET, {
    expiresIn: "7d", // cart lifetime
  });
}

export function verifyCartToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, CART_SECRET) as { cartId: string; type: string };
    if (decoded.type !== "cart") return null;
    return decoded.cartId;
  } catch {
    return null;
  }
}