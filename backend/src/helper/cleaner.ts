import cron from "node-cron";
import { supabase } from "../config/supabaseClient";

const isDev = process.env.NODE_ENV !== "production";

//  schedule
const SCHEDULE = isDev
  ? "*/1 * * * *" // every minute (dev)
  : "0 0 * * *";  // midnight (prod)

// cleanup job
cron.schedule(SCHEDULE, async () => {
  console.log("🧹 Cleaning old carts...");

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("carts")
    .delete()
    .lt("created_at", oneDayAgo)
    .is("user_id", null) // only guest carts
    .select(); // return deleted rows

  if (error) {
    console.error("Error deleting carts:", error.message);
  } else {
    console.log(`Deleted ${data?.length || 0} old carts`);
  }
});