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
type CartRequest = Request & { cartId: string };

// ─── Middleware ─────────────────────────────────────────────

function requireCart(req: Request, res: Response, next: NextFunction): void {
  let cartId = req.cookies.cartId;

  // 🆕 First-time visitor → create cartId cookie
  if (!cartId) {
    cartId = crypto.randomUUID();

    res.cookie("cartId", cartId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
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

      const cart = await cartService.getCart(cartId);
      // const token = signCartToken(cart.id);

      res.json({
        items: cart?.items ?? [],
      });
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

      // const token = signCartToken(cart.id);
      res.status(200).json({ items: cart.items });

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

      if (quantity == null || quantity < 1) {
        res.status(400).json({ error: "quantity must be >= 1" });
        return;
      }

      try {
        const cart = await cartService.updateQuantity(
          cartId,
          (req.params as { productId: string }).productId,
          quantity,
        );
        // const token = signCartToken(cart.id);
        res.json({ items: cart.items });

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
        // const token = signCartToken(cart.id);
        res.json({ items: cart.items });
      } catch (err) {
        res.status(500).json({ error: (err as Error).message });
      }
    },
  );

  // DELETE /api/cart
  router.delete("/", async (req: Request, res: Response): Promise<void> => {
    try {
      await cartService.clearCart((req as CartRequest).cartId);
      // const token = signCartToken((req as CartRequest).cartId);
      res.json({ items: [] });
      
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
