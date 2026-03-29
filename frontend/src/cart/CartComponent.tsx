import { useEffect, useState, type FC, type ReactNode } from "react";
import type { CartItem, Product } from "../types/types";
import { useCart } from "./CartContext";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
}
// ─── Add To Cart Button ───────────────────────────────────────────
interface AddToCartButtonProps{
    product: Product;
    quantity?: number;
    className?: string;
    children?: ReactNode;
}
export const AddToCartButton: FC<AddToCartButtonProps>= ({
    product,
    quantity =1,
    className="",
    children,
}) =>{
    const {addItem} = useCart();
    const [added, setAdded] = useState(false);

    const handleAdd = async(): Promise<void> =>{
        await addItem(product, quantity);
        setAdded(true);
        setTimeout(()=> setAdded(false),1500);
    };

    return(
        <button onClick={handleAdd} className={`atc-btn ${added ? "atc-btn--added" : ""} ${className}`}>
            {added ? "✓ Added" : children ?? "Add to Cart"}
        </button>
    )
}
// ─── Cart Item Row ────────────────────────────────────────────────
interface CartItemProps{
    item: CartItem;
}
export const CartItemRow: FC<CartItemProps> =({item}) =>{
    const {removeItem, updateQuantity} = useCart();


    return(
        <div className="cart-item">
      {item.image && (
        <img src={item.image} alt={item.name} className="cart-item__img" />
      )}
      <div className="cart-item__info">
        <span className="cart-item__name">{item.name}</span>
        <span className="cart-item__price">
          ${(item.price * item.quantity).toFixed(2)}
        </span>
      </div>
      <div className="cart-item__controls">
        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
          −
        </button>
        <span>{item.quantity}</span>
        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
          +
        </button>
      </div>
      <button
        className="cart-item__remove"
        onClick={() => removeItem(item.productId)}
        aria-label={`Remove ${item.name}`}
      >
        ✕
      </button>
    </div>
    );
};
// ─── Cart Summary ─────────────────────────────────────────────────
interface CartSummaryProps{
    onCheckout: ()=> void;
}

export const CartSummary: FC<CartSummaryProps> = ({onCheckout})=>{
    const {subtotal, itemCount} = useCart();
    const shipping = subtotal > 75 ? 0: 9.99;
    const total = subtotal + shipping;

    return(
        <div className="cart-summary">
        <div className="cart-summary__row">
          <span>Subtotal ({itemCount} items)</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="cart-summary__row">
          <span>Shipping</span>
          <span>{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
        </div>
        {shipping > 0 && (
          <p className="cart-summary__hint">
            Add ${(75 - subtotal).toFixed(2)} more for free shipping
          </p>
        )}
        <div className="cart-summary__row cart-summary__row--total">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <button
          className="cart-summary__checkout"
          onClick={onCheckout}
          disabled={itemCount === 0}
        >
          Checkout
        </button>
      </div>
    );
}
// ─── Cart Drawer ──────────────────────────────────────────────────
interface CartDrawerProps {
    open: boolean;
    onClose: ()=> void;
    onCheckout: ()=> void;
}
export const CartDrawer:FC<CartDrawerProps> = ({open, onClose, onCheckout})=>{
    const {items, itemCount, clearCart, loading} = useCart();

    useEffect(()=>{
        document.body.style.overflow= open? "hidden":"";
        return()=>{
            document.body.style.overflow= "";
        };
    }, [open]);

    return(
        <>
        <div
          className={`cart-overlay ${open ? "cart-overlay--visible" : ""}`}
          onClick={onClose}
          aria-hidden="true"
        />
        <aside
          className={`cart-drawer ${open ? "cart-drawer--open" : ""}`}
          aria-label="Shopping cart"
          role="dialog"
          aria-modal="true"
        >
          <header className="cart-drawer__header">
            <h2>
              Your Cart{" "}
              {itemCount > 0 && (
                <span className="cart-badge">{itemCount}</span>
              )}
            </h2>
            <button
              className="cart-drawer__close"
              onClick={onClose}
              aria-label="Close cart"
            >
              ✕
            </button>
          </header>
  
          <div className="cart-drawer__body">
            {loading && <p className="cart-drawer__status">Loading…</p>}
            {!loading && items.length === 0 && (
              <p className="cart-drawer__status">Your cart is empty.</p>
            )}
            {items.map((item) => (
              <CartItemRow key={item.productId} item={item} />
            ))}
          </div>
  
          {items.length > 0 && (
            <footer className="cart-drawer__footer">
              <CartSummary onCheckout={onCheckout} />
              <button className="cart-clear" onClick={clearCart}>
                Clear cart
              </button>
            </footer>
          )}
        </aside>
      </>
    );
}
// ─── Cart Toggle Button ───────────────────────────────────────────
interface CartToggleProps{
    onClick: ()=> void;
}

export const CartToggle:FC<CartToggleProps> =({onClick}) =>{
    const {itemCount} = useCart();

    return (
        <button
        className="cart-toggle"
        onClick={onClick}
        aria-label={`Open cart — ${itemCount} items`}
      >
        <span className="cart-toggle__icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </span>
        {itemCount > 0 && (
          <span className="cart-badge" aria-hidden="true">
            {itemCount}
          </span>
        )}
      </button> 
    );
}
// ─── Cart Checkout Modal ───────────────────────
export const CheckoutModal: FC<CheckoutModalProps> = ({ open, onClose }) => {
  const { checkout } = useCart();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    try {
      setError(null);
      setLoading(true);
      await checkout(email);
    } catch {
      setError("Checkout failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div
        className="checkout-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Checkout</h2>
        <p>Enter your email to complete your order</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && <p className="checkout-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Continue to Payment"}
          </button>
        </form>

        <button className="checkout-close" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
};