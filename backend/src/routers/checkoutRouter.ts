import { Router } from "express";
import { stripe } from "../config/stripe.js";
import { supabase } from "../config/supabaseClient.js";

const router = Router();

router.post("/", async (req, res) => {
  const { cartId, email } = req.body;

  if (!cartId || !email) {
    return res.status(400).json({ error: "Missing cartId or email" });
  }

  // 1. Get cart from DB
  const { data: cart } = await supabase
    .from("carts")
    .select("*")
    .eq("id", cartId)
    .single();

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: "Cart is empty" });
  }

  console.log("🛒 Cart items:", cart.items);
  // 2. Create Stripe line items
  const line_items = cart.items.map((item: any) => ({
    
    price_data: {
      currency: "usd",
      product_data: {
        name: item.name,
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  // 3. Create Stripe session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: email,
    billing_address_collection: "required",
    phone_number_collection: {
      enabled: true, // 👈 adds friction so UI doesn't skip
    },

    // client_reference_id: cartId,
    
    line_items,
    success_url: "http://localhost:5173/success",
    cancel_url: "http://localhost:5173/cart",
  });

  // 4. Save order in Supabase
  await supabase.from("orders").insert({
    cart_id: cartId,
    email,
    items: cart.items,
    amount: session.amount_total,
    status: "pending",
    stripe_session_id: session.id,
  });

  res.json({ url: session.url });
});

export default router;
