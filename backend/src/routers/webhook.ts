import { Router } from "express";
import { stripe } from "../config/stripe.js";
import { supabase } from "../config/supabaseClient.js";

const router = Router();

router.post("/webhook", async (req, res) => {
  const event = req.body;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("stripe_session_id", session.id);
  }

  res.json({ received: true });
});

export default router;