import jwt from "jsonwebtoken";

const CART_SECRET = process.env.CART_SECRET!;
const AUTH_SECRET = process.env.AUTH_SECRET!;


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

// export function signAuthToken(userId: string): string {
//   return jwt.sign({ userId, type: "auth" }, AUTH_SECRET, {
//     expiresIn: "7d",
//   });
// }

// export function verifyAuthToken(token: string): string | null {
//   try {
//     const decoded = jwt.verify(token, AUTH_SECRET) as {
//       userId: string;
//       type: string;
//     };

//     if (decoded.type !== "auth") return null;

//     return decoded.userId;
//   } catch {
//     return null;
//   }
// }