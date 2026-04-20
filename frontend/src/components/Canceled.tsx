import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { WEBHOOK_ENDPOINTS } from "../../api";
import { useCart } from "../cart";

export default function CanceledPage() {
  // const [params] = useSearchParams();
  const navigate = useNavigate();
 const { fetchCart } = useCart();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");

    // No session_id means someone navigated here directly — just redirect
    if (!sessionId) {
      navigate("/", { replace: true });
      return;
    }

    const cancelOrder = async () => {
      try {
        const res = await fetch(WEBHOOK_ENDPOINTS.CANCEL_ORDER, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (!res.ok) throw new Error("Cancel request failed");

        await fetchCart(); // refresh cart so it shows as active
        setStatus("done");
      } catch (err) {
        console.error("❌ Failed to cancel order:", err);
        setStatus("error");
      }
    };

    cancelOrder();
  }, []);

  if (status === "loading") return <p>Cancelling your order...</p>;
  if (status === "error") return <p>Something went wrong. Please contact support.</p>;


  return (
    <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "10px" }}>
        Payment canceled
      </h1>

      <p style={{ color: "#666", marginBottom: "30px" }}>
        Your order was not completed. You can try again anytime.
      </p>

      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button
          onClick={() => navigate("/cart")}
          style={{
            padding: "10px 20px",
            background: "#000",
            color: "#fff",
            borderRadius: "6px",
            border: "none",
          }}
        >
          Return to cart
        </button>

        <button
          onClick={() => navigate("/")}
          style={{
            padding: "10px 20px",
            background: "#eee",
            borderRadius: "6px",
            border: "none",
          }}
        >
          Continue shopping
        </button>
      </div>
    </div>
  );
}