import { Router } from "express";
import { stripe } from "../config/stripe.js";
import { supabase } from "../config/supabaseClient.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { email } = req.body;
    // const cartId = req.headers["x-cart-id"] as string;
    const cartId = (req as any).cartId;

    // Validate input
    if (!cartId || !email || !email.includes("@")) {
      return res.status(400).json({ error: "Invalid cartId or email" });
    }

    // Fetch cart from DB
    const { data: cart, error: cartError } = await supabase
      .from("carts")
      // .update({ status: "locked" })
      .select("*")
      .eq("id", cartId)
      .eq("owner_id", cartId)
      .single();

    if (cartError || !cart) {
      return res.status(500).json({ error: "Failed to fetch cart" });
    }
    if (cart.status === "locked") {
      return res.status(400).json({ error: "Cart already used" });
    }
    if (!cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }
    if (cart.owner_id !== cartId) {
      return res.status(403).json({ error: "Unauthorized cart access" });
    }

    await supabase.from("carts").update({ status: "locked" }).eq("id", cartId);

    // Re-fetch products from DB
    const line_items = await Promise.all(
      cart.items.map(async (item: any) => {
        const { data: product, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", item.productId)
          .single();

        if (error || !product) {
          throw new Error(`Invalid product: ${item.productId}`);
        }

        return {
          price_data: {
            currency: "sar",
            product_data: {
              name: product.name,
            },
            unit_amount: Math.round(product.price * 100), // 🔒 secure price
          },
          quantity: item.quantity,
        };
      }),
    );

    // Calculate total
    const total = line_items.reduce(
      (sum, item) => sum + item.price_data.unit_amount * item.quantity,
      0,
    );

    if (total <= 0) {
      return res.status(400).json({ error: "Invalid cart total" });
    }

    // Create Stripe session
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: email,

        billing_address_collection: "required",
        phone_number_collection: {
          enabled: true,
        },

        line_items,

        metadata: {
          cartId,
        },
        // 🔺NEED TO CHANGE URLS BEFORE DEPLOYMENT🔺
        success_url:
          "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:5173/cart",
      },
      {
        idempotencyKey: `${cartId}-${Date.now()}`
      },
    );

    // Saving order BEFORE payment confirmation
    const { error: orderError } = await supabase.from("orders").insert({
      cart_id: cartId,
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
});

export default router;
