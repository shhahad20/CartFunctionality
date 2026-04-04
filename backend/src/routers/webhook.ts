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
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      console.error("Missing Stripe signature");
      return res.status(400).send("Missing signature");
    }

    let event;

    try {
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(req.body || "");

      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      console.error("Signature verification failed:", err);
      return res.status(400).send("Webhook Error");
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;

        console.log("✅ Payment event:", session.id);

        // 🔒 verify payment
        if (session.payment_status !== "paid") {
          console.log("⚠️ Payment not completed");
          return res.status(200).json({ received: true });
        }

        const { data: order, error } = await supabase
          .from("orders")
          .select("*")
          .eq("stripe_session_id", session.id)
          .single();

        if (error || !order) {
          console.error("Order not found");
          return res.status(404).send("Order not found");
        }

        // 🔒 idempotency protection
        if (order.status !== "paid") {
          await supabase
            .from("orders")
            .update({ status: "paid" })
            .eq("id", order.id);

          await supabase
            .from("carts")
            .update({ items: [] })
            .eq("id", order.cart_id);

          console.log("Order marked as paid & cart cleared");
        } else {
          console.log("Order already processed");
        }
      }

      res.status(200).json({ received: true });
    } catch (err) {
      console.error("Webhook processing error:", err);
      res.status(500).send("Webhook failed");
    }
  },
);

export default router;
