import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { WEBHOOK_ENDPOINTS } from "../../api";

export default function CanceledPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = params.get("session_id");

 useEffect(() => {
  if (!sessionId) return;

  const alreadyCanceled = sessionStorage.getItem(sessionId);
  if (alreadyCanceled) return;

  fetch(`${WEBHOOK_ENDPOINTS.CANCEL_ORDER}?session_id=${sessionId}`, {
    method: "POST",
  });

  sessionStorage.setItem(sessionId, "true");
}, [sessionId]);

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