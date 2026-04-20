import { Router } from "express";
import express from "express";
import { stripe } from "../config/stripe.js";
import { supabase } from "../config/supabaseClient.js";
import bodyParser from "body-parser";
import { generateInvoicePDF } from "../helper/invoice.js";
import { emailSender } from "../helper/emailSender.js";
import { orderConfirmationTemplate } from "../helper/emails.js";
import { ORDER_STATUS } from "../types.js";
import { cancelOrderAndRestoreCart } from "./checkoutRouter.js";

const router = Router();
/*
WEBHOOK FLOW/OPERATIONS:
1. Verify signature → Security — reject anything unsigned.
2. Check payment_status === "paid" → Guard against non-payment events.
3. Lookup order by stripe_session_id → Find the pending order.
4. Idempotency check (status !== "paid") → Stripe can send the same event multiple times.
5. Update order to "paid" + save address/phone → Confirmed fulfillment data.
6. Generate PDF invoice → Only makes sense after confirmed payment.
7. Send confirmation email with PDF → Only after confirmed payment.
8. Clear/complete the cart → Cart lifecycle ends when payment is confirmed.

# Webhook should never: create the order row, validate cart ownership,
or do anything that requires the user's session — it runs server-to-server with no user context.
*/
// ⚠️ Stripe needs raw body

router.post("/cancel",express.json(), async (req: any, res: any) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  try {
    // Fetch session from Stripe to get metadata (cartId)
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const cartId = session.metadata?.cartId;

    await cancelOrderAndRestoreCart(sessionId, cartId, "User exited checkout");

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Cancel endpoint error:", err);
    return res.status(500).json({ error: "Failed to cancel order" });
  }
});


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
      // ── Session expired (fires ~30 min after user exits) ──────────────────
      if (event.type === "checkout.session.expired") {
        const session = event.data.object as any;
        const cartId = session.metadata?.cartId;

        console.log(`⏰ Session expired: ${session.id}`);
        await cancelOrderAndRestoreCart(session.id, cartId, "Session expired");
      }

      // ── Successful payment ────────────────────────────────────────────────

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;

        const cartId = session.metadata.cartId;

        const phone =
          session.customer_details?.phone ||
          session.customer_details?.phone_number ||
          null;

        const address =
          session.customer_details?.address ||
          session.shipping_details?.address ||
          null;

        const country = address?.country || null;
        const city = address?.city || null;
        const postal_code = address?.postal_code || null;
        const line1 = address?.line1 || null;

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
        if (order.status === "paid") {
          console.log("Already processed, skipping");
          return res.status(200).json({ received: true });
        }

        // 🔒 idempotency protection
        if (order.status !== "paid") {
          await supabase
            .from("orders")
            .update({
              status: "paid",
              phone: phone,
              country: address?.country || null,
              city: address?.city || null,
              address_line1: address?.line1 || null,
              postal_code: address?.postal_code || null,
              order_status: ORDER_STATUS.PROCESSING,
            })
            .eq("id", order.id)
            .neq("status", "paid");

          // Re-fetch so the PDF has the full updated record
          const { data: updatedOrder } = await supabase
            .from("orders")
            .select("*")
            .eq("id", order.id)
            .single();

          const pdfBuffer = await generateInvoicePDF(updatedOrder);
          await emailSender({
            email: order.email,
            subject: "Your Order Confirmation",
            html: orderConfirmationTemplate(order),
            attachments: [
              {
                filename: `invoice-${order.id}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ],
          });

          const { error: cartError } = await supabase
            .from("carts")
            .update({ items: [], status: "active" })
            .eq("id", order.cart_id);

          if (cartError) {
            console.error("Failed to clear cart:", cartError);
            // Don't return 500 here — payment is confirmed, log and alert instead
          }

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
