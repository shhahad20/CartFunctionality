import { Router } from "express";
import { stripe } from "../config/stripe.js";
import { supabase } from "../config/supabaseClient.js";
import bodyParser from "body-parser";

const router = Router();

// ⚠️ Stripe needs raw body
router.post(
  "/",
  bodyParser.raw({ type: "application/json" }),

  async (req: any, res: any) => {
    // Stripe requires the raw body as a Buffer
    const sig = req.headers["stripe-signature"] as string | undefined;
    if (!sig) {
      console.error("❌ Missing Stripe signature header");
      res.status(400).send("Missing Stripe signature");
      return;
    }

    let event;
    try {
      // Ensure req.body is a Buffer
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(req.body || "");
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      console.error("❌ Webhook signature failed:", err);
      res.status(400).send("Webhook Error");
      return;
    }

    // 🎯 Handle event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;

      console.log("✅ Payment successful:", session.id);
      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("stripe_session_id", session.id)
        .single();

      if (order) {
        // ✅ mark as paid
        await supabase
          .from("orders")
          .update({ status: "paid" })
          .eq("id", order.id);

        // ✅ clear cart
        await supabase
          .from("carts")
          .update({ items: [] })
          .eq("id", order.cart_id);
      }
      //  Update order in DB
      // const { error } = await supabase
      //   .from("orders")
      //   .update({ status: "paid" })
      //   .eq("stripe_session_id", session.id);

      // if (error) {
      //   console.error("❌ Failed to update order:", error);
      // } else {
      //   console.log("✅ Order marked as PAID");
      // }
    }

    res.status(200).json({ received: true });
  },
);

export default router;
