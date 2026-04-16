import { Router } from "express";
import { stripe } from "../config/stripe.js";
import { supabase } from "../config/supabaseClient.js";
import bodyParser from "body-parser";
import { generateInvoicePDF } from "../helper/invoice.js";
import { emailSender } from "../helper/emailSender.js";

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
            })
            .eq("id", order.id)
            .neq("status", "paid");

          const pdfBuffer = await generateInvoicePDF(order);
          await emailSender({
            email: order.email,
            subject: "Your Order Confirmation",
            html: `
              <h1>Thank you for your order</h1>
              <p>Order ID: ${order.id}</p>
              <p>Total: $${order.total}</p>
              <h3>Items:</h3>
              <ul>
               ${order.items.map((i: any) => `<li>${i.name} x${i.quantity}</li>`).join("")}
              </ul>
              `,
            attachments: [
              {
                filename: `invoice-${order.id}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ],
          });

          await supabase
            .from("carts")
            .update({ items: [], status: "completed" })
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
