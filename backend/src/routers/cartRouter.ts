import { Router, Request, Response, NextFunction } from "express";
import { CartService } from "../controllers/cartController.js";
import type {
  AddItemRequest,
  UpdateQuantityRequest,
  CartResponse,
  ApiError,
} from "../types.js";
import { signCartToken, verifyCartToken } from "../helper/jwt.js";

// ─── Typed request helpers ────────────────────────────────────────

type AuthRequest = Request & { userId: string };

// ─── Auth middleware ──────────────────────────────────────────────

type CartRequest = Request & { cartId: string };

function requireCart(req: Request, res: Response, next: NextFunction): void {
  // const cartId = req.headers["x-cart-id"] as string;
  const token = req.headers["x-cart-token"] as string;
  if (!token) {
    res.status(401).json({ error: "Missing cart token" });
    return;
  }

  // if (!cartId || typeof cartId !== "string") {
  //   res.status(400).json({ error: "Missing cartId" });
  //   return;
  // }
  const cartId = verifyCartToken(token);

  if (!cartId) {
    res.status(401).json({ error: "Invalid cart token" });
    return;
  }

  (req as CartRequest).cartId = cartId;
  next();
}

// ─── Router factory ───────────────────────────────────────────────

export function createCartRouter(cartService: CartService): Router {
  const router = Router();

  router.use(requireCart);

  // GET /api/cart
  router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
      const cartId = (req as CartRequest).cartId;
      if (!cartId) {
        res.status(400).json({ error: "Missing cartId" });
        return;
      }

      const cart = await cartService.getCart(cartId);
      const token = signCartToken(cart.id);

      res.json({ items: cart.items, token });
    } catch (err) {
      console.error("GET /cart error:", err); // 🔺TO BE DELETED LATER🔺
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // POST /api/cart/items
  router.post("/items", async (req: Request, res: Response): Promise<void> => {
    const { productId, quantity = 1 } = req.body as AddItemRequest;
    const cartId = (req as CartRequest).cartId;

    if (!productId) {
      res.status(400).json({ error: "productId is required" });
      return;
    }
    if (quantity < 1) {
      res.status(400).json({ error: "quantity must be >= 1" });
      return;
    }

    try {
      const cart = await cartService.addItem(cartId, {
        productId,
        quantity,
      });
const token = signCartToken(cart.id);
      res.status(200).json({ items: cart.items, token });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // PATCH /api/cart/items/:productId
  router.patch(
    "/items/:productId",
    async (req: Request, res: Response): Promise<void> => {
      const { quantity } = req.body as UpdateQuantityRequest;
      const cartId = (req as CartRequest).cartId;

      if (quantity == null) {
        res.status(400).json({ error: "quantity is required" });
        return;
      }

      try {
        const cart = await cartService.updateQuantity(
          cartId,
          (req.params as { productId: string }).productId,
          quantity,
        );
        const token = signCartToken(cart.id);
        res.json({ items: cart.items, token });
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    },
  );

  // DELETE /api/cart/items/:productId
  router.delete(
    "/items/:productId",
    async (req: Request, res: Response): Promise<void> => {
      try {
        const cart = await cartService.removeItem(
          (req as CartRequest).cartId,
          (req.params as { productId: string }).productId,
        );
        const token = signCartToken(cart.id);
        res.json({ items: cart.items, token });
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    },
  );

  // DELETE /api/cart
  router.delete("/", async (req: Request, res: Response): Promise<void> => {
    try {
      await cartService.clearCart((req as CartRequest).cartId);
      const token = signCartToken((req as CartRequest).cartId);
      res.json({ items: [], token });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
