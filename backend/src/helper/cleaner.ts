import cron from "node-cron";
import { supabase } from "../config/supabaseClient";
import { ORDER_STATUS } from "../types";
import { stripe } from "../config/stripe";

const isDev = process.env.NODE_ENV !== "production";

//  schedule
// const SCHEDULE = isDev
//   ? "*/1 * * * *" // every minute (dev)
//   : "0 0 * * *";  // midnight (prod)

// Job: Abandoned Guest Carts Cleanup.

cron.schedule(isDev ? "*/1 * * * *" : "0 0 * * *", async () => {
  console.log("Cleaning abandoned guest carts...");

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("carts")
    .delete()
    .lt("created_at", oneDayAgo)
    .is("user_id", null)
    .eq("status", "active")
    .select();

  if (error) {
    console.error("❌ Error deleting guest carts:", error.message);
  } else {
    console.log(`✅ Deleted ${data?.length ?? 0} abandoned guest cart(s)`);
  }
});

// Job: Stuck Pending Orders Cleanup.
cron.schedule(isDev ? "*/2 * * * *" : "*/10 * * * *", async () => {
  console.log("Cleaning stuck pending orders...");

  const cutoff = new Date(Date.now() - 35 * 60 * 1000).toISOString();

  const { data: stuckOrders, error } = await supabase
    .from("orders")
    .select("id, cart_id, stripe_session_id")
    .eq("status", "pending")
    .eq("order_status", ORDER_STATUS.PENDING)
    .lt("created_at", cutoff);

  if (error) {
    console.error("Failed to fetch stuck orders:", error);
    return;
  }

  if (!stuckOrders?.length) {
    console.log("No stuck orders found");
    return;
  }

  console.log(`Found ${stuckOrders.length} stuck order(s)`);

  for (const order of stuckOrders) {
    try {
      const session = await stripe.checkout.sessions.retrieve(
        order.stripe_session_id,
      );

      if (session.payment_status === "paid") {
        // Stripe says paid but webhook was missed — recover it
        await supabase
          .from("orders")
          .update({ status: "paid", order_status: ORDER_STATUS.PROCESSING })
          .eq("id", order.id);

        await supabase
          .from("carts")
          .update({ items: [], status: "active" })
          .eq("id", order.cart_id);

        console.log(`Recovered missed payment for order: ${order.id}`);
      } else {

        await supabase
          .from("orders")
          .update({ order_status: ORDER_STATUS.CANCELED })
          .eq("id", order.id);

        await supabase
          .from("carts")
          .update({ status: "active" })
          .eq("id", order.cart_id);

        console.log(`Canceled stuck order and restored cart: ${order.id}`);
      }
    } catch (err) {
      console.error(`Failed to process order ${order.id}:`, err);
    }
  }
});