import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCart } from "../cart";

type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  email: string;
  status: string;
  amount: number;
  items: OrderItem[];
};

export default function SuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCart();

  useEffect(() => {
    if (!sessionId) return;

    fetch(`http://localhost:4000/api/orders/session/${sessionId}`)
      .then((res) => res.json())
      .then(setOrder)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    if (order) {
      clearCart(); // 🧹 clear local state
    }
  }, [order]);

  if (loading) return <p style={{ padding: 20 }}>Loading your order...</p>;

  if (!order) return <p style={{ padding: 20 }}>Order not found.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>🎉 Payment Successful</h1>
      <p>Thank you for your order!</p>

      <h3>Order Details</h3>
      <p>
        <strong>Email:</strong> {order.email}
      </p>
      <p>
        <strong>Status:</strong> {order.status}
      </p>
      <p>
        <strong>Total:</strong> ${(order.amount / 100).toFixed(2)}
      </p>

      <h4>Items:</h4>
      <ul>
        {order.items.map((item: OrderItem) => (
          <li key={item.productId}>
            {item.name} × {item.quantity} — ${item.price}
          </li>
        ))}
      </ul>
      <button onClick={() => (window.location.href = "/")}>Back to Home</button>
    </div>
  );
}
