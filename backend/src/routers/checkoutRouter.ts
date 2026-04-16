import { Router } from "express";
import { stripe } from "../config/stripe.js";
import { supabase } from "../config/supabaseClient.js";
import { requireAuth } from "../middlewares/auth.js";
import { mergeOrAssignCart } from "../controllers/cartController.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const email = user.email;
    const userId = user.id;
    // const cartId = (req as any).cartId;
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
    await supabase
      .from("carts")
      .update({ status: "locked" })
      .eq("id", cartId);

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
      })
    );

    // ── Validate total ────────────────────────────────────────────────────────
    const total = line_items.reduce(
      (sum, item) => sum + item.price_data.unit_amount * item.quantity,
      0
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
        cancel_url: "http://localhost:5173",
      },
      {
        idempotencyKey: `${cartId}-${userId}`, // userId makes this more stable than Date.now()
      }
    );

    // ── Persist pending order ─────────────────────────────────────────────────
    const { error: orderError } = await supabase.from("orders").insert({
      cart_id: cartId,
      user_id: userId,
      email,
      items: cart.items,
      amount: total,
      status: "pending",
      stripe_session_id: session.id,
    });

    if (orderError) {
      console.error("❌ Order insert failed:", orderError);
      return res.status(500).json({ error: "Failed to create order" });
    }

    console.log("✅ Stripe session created:", session.id);
    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Checkout error:", err);
    res.status(500).json({ error: "Checkout failed" });
  }

  //   // Fetch cart from DB
  //   const { data: cart, error: cartError } = await supabase
  //     .from("carts")
  //     .select("*")
  //     .eq("id", cartId)
  //     .eq("user_id", userId)
  //     .single();

  //   if (cartError || !cart) {
  //     return res.status(404).json({ error: "Cart not found" });
  //   }

  //   if (cart.status === "locked") {
  //     return res.status(400).json({ error: "Cart already used" });
  //   }

  //   if (!cart.items || cart.items.length === 0) {
  //     return res.status(400).json({ error: "Cart is empty" });
  //   }

  //   await supabase.from("carts").update({ status: "locked" }).eq("id", cartId);

  //   // Re-fetch products from DB
  //   const line_items = await Promise.all(
  //     cart.items.map(async (item: any) => {
  //       const { data: product, error } = await supabase
  //         .from("products")
  //         .select("*")
  //         .eq("id", item.productId)
  //         .single();

  //       if (error || !product) {
  //         throw new Error(`Invalid product: ${item.productId}`);
  //       }

  //       return {
  //         price_data: {
  //           currency: "sar",
  //           product_data: {
  //             name: product.name,
  //           },
  //           unit_amount: Math.round(product.price * 100), // secure price
  //         },
  //         quantity: item.quantity,
  //       };
  //     }),
  //   );

  //   // Calculate total
  //   const total = line_items.reduce(
  //     (sum, item) => sum + item.price_data.unit_amount * item.quantity,
  //     0,
  //   );

  //   if (total <= 0) {
  //     return res.status(400).json({ error: "Invalid cart total" });
  //   }

  //   // Create Stripe session
  //   const session = await stripe.checkout.sessions.create(
  //     {
  //       payment_method_types: ["card"],
  //       mode: "payment",
  //       customer_email: user.email,

  //       billing_address_collection: "required",
  //       phone_number_collection: {
  //         enabled: true,
  //       },
  //       shipping_address_collection: {
  //         allowed_countries: ["SA"], // 🔺🔺 Need to specify allowed countries for shipping address collection
  //       },
  //       line_items,

  //       metadata: {
  //         cartId,
  //       },
  //       // 🔺NEED TO CHANGE URLS BEFORE DEPLOYMENT🔺
  //       success_url:
  //         "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
  //       cancel_url: "http://localhost:5173",
  //     },
  //     {
  //       idempotencyKey: `${cartId}-${Date.now()}`,
  //     },
  //   );

  //   // Saving order BEFORE payment confirmation
  //   const { error: orderError } = await supabase.from("orders").insert({
  //     cart_id: cartId,
  //     user_id: userId,
  //     email: user.email,
  //     items: cart.items,
  //     amount: total,
  //     status: "pending",
  //     stripe_session_id: session.id,
  //   });

  //   if (orderError) {
  //     console.error("❌ Order insert failed:", orderError);
  //     return res.status(500).json({ error: "Failed to create order" });
  //   }

  //   console.log("✅ Stripe session created:", session.id);

  //   res.json({ url: session.url });
  // } catch (err) {
  //   console.error("❌ Checkout error:", err);
  //   res.status(500).json({ error: "Checkout failed" });
  // }
});

export default router;
