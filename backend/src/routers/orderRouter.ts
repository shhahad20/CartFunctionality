import { Router } from "express";
import { supabase } from "../config/supabaseClient.js";

const router = Router();

router.get("/session/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("stripe_session_id", sessionId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Order not found" });
  }

  res.json(data);
});


export default router;