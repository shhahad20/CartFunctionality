import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCart } from "../cart";
import { BookmarkCheck } from 'lucide-react';


type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  orderId: string;
  email: string;
  status: string;
  amount: number;
  items: OrderItem[];
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
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
      clearCart();
    }
  }, [order]);

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

  if (loading) {
    return (
      <div style={styles.loadingWrapper}>
        <div style={styles.loadingDot} />
        <p style={styles.loadingText}>Loading your order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={styles.loadingWrapper}>
        <p style={styles.loadingText}>Order not found.</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.invoice}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>

                  <BookmarkCheck />
            </div>
            <span style={styles.logoText}>ORDER CONFIRMED</span>
          </div>
          <div style={styles.headerMeta}>
            <p style={styles.metaLine}>your order</p>
            <p style={styles.metaLine}>has been placed</p>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Billing Info Row */}
        <div style={styles.billingRow}>
          <div style={styles.billingLeft}>
            <p style={styles.label}>BILLED TO</p>
            <p style={styles.billingEmail}>{order.email}</p>
            {order.address && (
              <div style={styles.addressBlock}>
                <p style={styles.addressLine}>{order.address.line1}</p>
                {order.address.line2 && (
                  <p style={styles.addressLine}>{order.address.line2}</p>
                )}
                <p style={styles.addressLine}>
                  {order.address.city}, {order.address.state}
                </p>
                <p style={styles.addressLine}>{order.address.postalCode}</p>
                <p style={styles.addressLine}>{order.address.country}</p>
              </div>
            )}
          </div>

          <div style={styles.billingRight}>
            <div style={styles.metaItem}>
              <p style={styles.label}>DATE ISSUED</p>
              <p style={styles.metaValue}>{today}</p>
            </div>
            <div style={styles.metaItem}>
              <p style={styles.label}>ORDER NO.</p>
              <p style={styles.metaValue}>
                {order.orderId ?? sessionId?.slice(-8).toUpperCase()}
              </p>
            </div>
            <div style={styles.metaItem}>
              <p style={styles.label}>STATUS</p>
              <p style={{ ...styles.metaValue, ...styles.statusBadge }}>
                {order.status.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Items Table */}
        <div style={styles.tableHeader}>
          <span style={{ ...styles.col, flex: 3 }}>DESCRIPTION</span>
          <span style={{ ...styles.col, flex: 1, textAlign: "right" }}>QTY</span>
          <span style={{ ...styles.col, flex: 1, textAlign: "right" }}>UNIT PRICE</span>
          <span style={{ ...styles.col, flex: 1, textAlign: "right" }}>SUBTOTAL</span>
        </div>

        <div style={styles.divider} />

        {order.items.map((item: OrderItem) => (
          <div key={item.productId} style={styles.tableRow}>
            <span style={{ ...styles.itemName, flex: 3 }}>{item.name}</span>
            <span style={{ ...styles.itemValue, flex: 1, textAlign: "right" }}>
              {item.quantity}
            </span>
            <span style={{ ...styles.itemValue, flex: 1, textAlign: "right" }}>
              ${item.price.toFixed(2)}
            </span>
            <span style={{ ...styles.itemSubtotal, flex: 1, textAlign: "right" }}>
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}

        {/* Footer Banner */}
        <div style={styles.footerBanner}>
          <div style={styles.footerLeft}>
            <p style={styles.footerLabel}>SHIP TO</p>
            {order.address ? (
              <>
                <p style={styles.footerValue}>{order.address.line1}</p>
                <p style={styles.footerValue}>
                  {order.address.city}, {order.address.postalCode}
                </p>
              </>
            ) : (
              <p style={styles.footerValue}>See confirmation email</p>
            )}
          </div>

          <div style={styles.footerMid}>
            <p style={styles.footerLabel}>ORDER ID</p>
            <p style={styles.footerValue}>
              #{order.orderId ?? sessionId?.slice(-8).toUpperCase()}
            </p>
          </div>

          <div style={styles.footerRight}>
            <p style={styles.footerLabel}>TOTAL PAID</p>
            <p style={styles.totalAmount}>${(order.amount / 100).toFixed(2)}</p>
          </div>
        </div>

        {/* Thank You */}
        <div style={styles.thankYouRow}>
          <div style={styles.thankYouLeft}>
            <span style={styles.heart}>♥</span>
            <span style={styles.thankYouText}>Thank you!</span>
          </div>
          <div style={styles.contactRow}>
            <span style={styles.contactItem}>{order.email}</span>
            <span style={styles.contactDivider}>|</span>
            <button
              onClick={() => (window.location.href = "/")}
              style={styles.homeButton}
            >
              Back to Shop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    // backgroundColor: "#f5f4f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
    
    // fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  invoice: {
    backgroundColor: "#ffffff",
    width: "100%",
    maxWidth: "680px",
    boxShadow: "0 4px 40px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "36px 40px 28px",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  logoIcon: {
    display: "flex",
    alignItems: "flex-end",
    color: "#1a1a1a",
  },
  logoText: {
    // fontFamily: "'Arial Narrow', Arial, sans-serif",
    fontSize: "22px",
    fontWeight: "700",
    // letterSpacing: "0.08em",
    color: "#1a1a1a",

  },
  headerMeta: {
    textAlign: "right",
  },
  metaLine: {
    margin: 0,
    fontSize: "13px",
    color: "#888",
    // letterSpacing: "0.04em",
    lineHeight: 1.6,
    // fontFamily: "Arial, sans-serif",
  },
  divider: {
    height: "1px",
    backgroundColor: "#e8e8e4",
    margin: "0 40px",
  },
  billingRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "28px 40px",
    gap: "24px",
  },
  billingLeft: {
    flex: 1,
  },
  billingRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "10px",
  },
  label: {
    margin: "0 0 4px",
    fontSize: "10px",
    letterSpacing: "0.12em",
    color: "#aaa",
    // fontFamily: "Arial, sans-serif",
    fontWeight: "600",
  },
  billingEmail: {
    margin: "0 0 8px",
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a1a1a",
    // fontFamily: "Arial, sans-serif",
  },
  addressBlock: {
    marginTop: "4px",
  },
  addressLine: {
    margin: "1px 0",
    fontSize: "13px",
    color: "#555",
    // fontFamily: "Arial, sans-serif",
    lineHeight: 1.5,
  },
  metaItem: {
    textAlign: "right",
  },
  metaValue: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "600",
    color: "#1a1a1a",
    // fontFamily: "Arial, sans-serif",
  },
  statusBadge: {
    color: "#e94560",
    // letterSpacing: "0.06em",
  },
  tableHeader: {
    display: "flex",
    padding: "10px 40px",
    gap: "8px",
  },
  col: {
    fontSize: "10px",
    letterSpacing: "0.12em",
    color: "#aaa",
    // fontFamily: "Arial, sans-serif",
    fontWeight: "600",
    margin: 0,
  },
  tableRow: {
    display: "flex",
    padding: "18px 40px",
    borderBottom: "1px solid #f0efe9",
    gap: "8px",
    alignItems: "center",
  },
  itemName: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#1a1a1a",
  },
  itemValue: {
    fontSize: "15px",
    color: "#555",
  },
  itemSubtotal: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#1a1a1a",
  },
  footerBanner: {
    backgroundColor: "#f5f4f0",
    padding: "28px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginTop: "8px",
  },
  footerLeft: {},
  footerMid: {},
  footerRight: {
    textAlign: "right",
  },
  footerLabel: {
    margin: "0 0 4px",
    fontSize: "10px",
    letterSpacing: "0.12em",
    color: "#aaa",
    fontWeight: "600",
  },
  footerValue: {
    margin: "2px 0",
    fontSize: "13px",
    fontWeight: "600",
    color: "#1a1a1a",
  },
  totalAmount: {
    margin: "4px 0 0",
    fontSize: "15px",
    fontWeight: "700",
    color: "#e94560",
  },
  thankYouRow: {
    padding: "20px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #e8e8e4",
  },
  thankYouLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  heart: {
    color: "#1a1a1a",
    fontSize: "15px",
  },
  thankYouText: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1a1a1a",
  },
  contactRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  contactItem: {
    fontSize: "12px",
    color: "#888",
  },
  contactDivider: {
    color: "#ccc",
    fontSize: "12px",
  },
  homeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    color: "#333333",
    fontWeight: "600",
    padding: 0,
    textDecoration: "underline",
  },
  loadingWrapper: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    backgroundColor: "#f5f4f0",
  },
  loadingDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#E8614A",
    animation: "pulse 1s infinite",
  },
  loadingText: {
    color: "#888",
    fontSize: "14px",
    margin: 0,
  },
};