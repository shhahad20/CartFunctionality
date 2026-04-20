import { Router } from "express";
import { stripe } from "../config/stripe.js";
import { supabase } from "../config/supabaseClient.js";
import { requireAuth } from "../middlewares/auth.js";
import { mergeOrAssignCart } from "../controllers/cartController.js";
import { v4 as uuidv4 } from "uuid";
import { ORDER_STATUS } from "../types.js";

const router = Router();

/* CHECKOUT FLOW/OPERATIONS :

1. Validate cart ownership & merge → Must happen before anything else.
2. Lock the cart → Prevents double-submission while user is on Stripe page.
3. Re-fetch product prices from DB → Never trust client prices.
4. Insert order row as "pending" → Must exist before Stripe session so webhook never misses it.
5. Create Stripe session → Core purpose of the route.
6. Patch stripe_session_id onto the order → Links the order to the session for the webhook to find.
7. Return session.url → Send user to Stripe.

# Checkout should never: send emails, generate PDFs,
mark anything paid, or clear carts. Payment hasn't been confirmed yet.
*/
export async function cancelOrderAndRestoreCart(
  sessionId: string,
  cartId?: string,
  reason = "User exited or session expired",
) {
  console.log(`🔄 Canceling order for session: ${sessionId}, reason: ${reason}`);

  // 1. Cancel the order tied to this session
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, order_status, cart_id")
    .eq("stripe_session_id", sessionId)
    .single();

  if (fetchError || !order) {
    console.warn(`⚠️ No order found for session: ${sessionId}`);
    return;
  }

  // Idempotency: skip if already canceled
  if (order.order_status === ORDER_STATUS.CANCELED) {
    console.log(`ℹ️ Order already canceled, skipping: ${order.id}`);
    return;
  }

  const { error: orderError } = await supabase
    .from("orders")
    .update({ order_status: ORDER_STATUS.CANCELED })
    .eq("id", order.id);

  if (orderError) {
    console.error("❌ Failed to cancel order:", orderError);
  } else {
    console.log(`✅ Order canceled: ${order.id}`);
  }

  // 2. Restore the cart — prefer cart_id from the order row, fallback to metadata
  const resolvedCartId = order.cart_id || cartId;

  if (!resolvedCartId) {
    console.warn("⚠️ No cartId available to restore");
    return;
  }

  const { error: cartError } = await supabase
    .from("carts")
    .update({ status: "active" })
    .eq("id", resolvedCartId);

  if (cartError) {
    console.error("❌ Failed to restore cart:", cartError);
  } else {
    console.log(`✅ Cart restored: ${resolvedCartId}`);
  }
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const key = uuidv4();
    const user = (req as any).user;
    const email = user.email;
    const userId = user.id;

    let cartId: string = (req as any).cartId;

    // Validate input
    if (!cartId || !email || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid cartId or email" });
    }

    try {
      const { canonicalCartId } = await mergeOrAssignCart(cartId, userId);

      if (canonicalCartId !== cartId) {
        // Guest cart was merged into an existing user cart; update cookie
        cartId = canonicalCartId;
        res.cookie("cartId", cartId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        });
      }
    } catch (mergeErr: any) {
      // "Cart belongs to another user" is a hard stop; anything else we log
      // and proceed — the ownership query below will surface the real error.
      if (mergeErr.message === "Cart belongs to another user") {
        return res.status(403).json({ error: "Cart ownership conflict" });
      }
      console.warn("⚠️ Cart merge/assign skipped:", mergeErr.message);
    }

    // ── Fetch cart with strict ownership now guaranteed ──────────────────────
    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("*")
      .eq("id", cartId)
      .eq("user_id", userId)
      .single();

    if (cartError || !cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    if (cart.status === "locked") {
      return res.status(400).json({ error: "Cart already used" });
    }

    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // ── Lock the cart optimistically ─────────────────────────────────────────
    await supabase.from("carts").update({ status: "locked" }).eq("id", cartId);

    // ── Re-fetch products from DB (never trust client-side prices) ───────────
    const line_items = await Promise.all(
      cart.items.map(async (item: any) => {
        const { data: product, error } = await supabase
          .from("products")
          .select("id, name, price")
          .eq("id", item.productId)
          .single();

        if (error || !product) {
          throw new Error(`Invalid product: ${item.productId}`);
        }

        return {
          price_data: {
            currency: "sar",
            product_data: { name: product.name },
            unit_amount: Math.round(product.price * 100),
          },
          quantity: item.quantity,
        };
      }),
    );

    // ── Validate total ────────────────────────────────────────────────────────
    const total = line_items.reduce(
      (sum, item) => sum + item.price_data.unit_amount * item.quantity,
      0,
    );

    if (total <= 0) {
      return res.status(400).json({ error: "Invalid cart total" });
    }


    // ── Create Stripe session ─────────────────────────────────────────────────
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: email,
        billing_address_collection: "required",
        phone_number_collection: { enabled: true },
        shipping_address_collection: {
          allowed_countries: ["SA"], // 🔺 Update before deployment
        },
        line_items,
        metadata: { cartId },
        // 🔺 Update URLs before deployment
        success_url:
          "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url:
          "http://localhost:5173/cancel?session_id={CHECKOUT_SESSION_ID}",
      },
      {
        idempotencyKey: `${cartId}-${userId}-${key}`,
      },
    );

        // ── Persist pending order ─────────────────────────────────────────────────
    const { error: orderError } = await supabase.from("orders").insert({
      cart_id: cartId,
      user_id: userId,
      email,
      items: cart.items,
      amount: total,
      status: "pending",
      order_status: ORDER_STATUS.PENDING,
      stripe_session_id: session.id,
    });

    if (orderError) {
      console.error("❌ Order insert failed:", orderError);
      return res.status(500).json({ error: "Failed to create order" });
    }
    // ── Patch the session ID onto the order ──────────────────────────────────────
    // const { error: patchError } = await supabase
    //   .from("orders")
    //   .update({ stripe_session_id: session.id })
    //   .eq("cart_id", cartId)
    //   .eq("user_id", userId)
    //   .eq("status", "pending");

    // if (patchError) {
    //   console.error("⚠️ Could not patch stripe_session_id:", patchError);
    // }

    console.log("✅ Stripe session created:", session.id);
    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Checkout error:", err);
    res.status(500).json({ error: "Checkout failed" });
  }
});
// Cancel
// router.post("/cancel", async (req: any, res: any) => {
//   const { sessionId } = req.body;

//   if (!sessionId) {
//     return res.status(400).json({ error: "Missing session ID" });
//   }

//   try {
//     // Retrieve session from Stripe to get metadata safely
//     const session = await stripe.checkout.sessions.retrieve(sessionId);
//     const cartId = session.metadata?.cartId;

//     // Only cancel if still pending — guard against race with webhook
//     const { data: order } = await supabase
//       .from("orders")
//       .select("id, order_status")
//       .eq("stripe_session_id", sessionId)
//       .single();

//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     if (order.order_status === ORDER_STATUS.CANCELED) {
//       return res.status(200).json({ message: "Already canceled" });
//     }

//     await supabase
//       .from("orders")
//       .update({
//         order_status: ORDER_STATUS.CANCELED,
//         // cancel_reason: "User exited checkout",
//       })
//       .eq("id", order.id);

//     // Restore cart so the user can retry
//     if (cartId) {
//       await supabase
//         .from("carts")
//         .update({ status: "active" })
//         .eq("id", cartId);
//     }

//     return res.status(200).json({ message: "Order canceled, cart restored" });
//   } catch (err) {
//     console.error("Cancel order error:", err);
//     return res.status(500).json({ error: "Failed to cancel order" });
//   }
// });
// routes/order.ts
// router.post("/cancel", async (req: any, res: any) => {
//   const { sessionId } = req.body;

//   if (!sessionId) {
//     return res.status(400).json({ error: "Missing sessionId" });
//   }

//   try {
//     // Fetch session from Stripe to get metadata (cartId)
//     const session = await stripe.checkout.sessions.retrieve(sessionId);
//     const cartId = session.metadata?.cartId;

//     await cancelOrderAndRestoreCart(sessionId, cartId, "User exited checkout");

//     return res.status(200).json({ success: true });
//   } catch (err) {
//     console.error("❌ Cancel endpoint error:", err);
//     return res.status(500).json({ error: "Failed to cancel order" });
//   }
// });

export default router;
