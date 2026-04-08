import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { CartProvider, CartDrawer, CartToggle } from "./cart";
import {  useAuth } from "./auth/AuthProvider";
import type { Product } from "./types/types";
import "./App.css";
import { ProductDetailsPage } from "./product/ProductDetailsPage.tsx";
import { CheckoutModal } from "./cart/CartComponent.tsx";
import SuccessPage from "./components/SuccessPage.tsx";
import { AuthModal } from "./components/AuthModal.tsx";
import { LogOut } from 'lucide-react';

function ProductCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: () => void;
}) {
  return (
    <article
      className="productCard"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
    >
      <div className="cardMedia">
        <img src={product.image} alt={product.name} className="cardImage" />
        <div className="cardOverlay" />
      </div>

      <div className="cardBody">
        <div className="cardHeader">
          <div className="product-cat">
            <h3 className="cardTitle">{product.name}</h3>
          </div>
          <span className="cardBadge">{product.tag}</span>
        </div>

        <div className="cardFooter">
          <div className="cardFooterPrice">
            {product.price === 0 ? "Pre-Order" : `${product.price} SAR`}
          </div>
        </div>
      </div>
    </article>
  );
}

function ProductsHome() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:4000/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p style={{ padding: 16 }}>Loading products...</p>;
  }

  if (products.length === 0) {
    return <p style={{ padding: 16 }}>No products found.</p>;
  }

  return (
    <main className="productsGrid">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          onOpen={() => navigate(`/product/${p.id}`)}
        />
      ))}
    </main>
  );
}

function ProductDetailsRoute() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:4000/api/products/${id}`)
      .then((res) => res.json())
      .then(setProduct)
      .catch((err) => console.error(err));
  }, [id]);

  if (!product) {
    return <div style={{ padding: 16 }}>Loading product...</div>;
  }

  return <ProductDetailsPage product={product} />;
}

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { user, logout } = useAuth();
  const handleCheckout = () => {
    setCheckoutOpen(true);
  };
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:4000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .catch(() => {
        localStorage.removeItem("token");
      });
  }, []);

  return (
    <BrowserRouter>
        <CartProvider apiBase="http://localhost:4000/api/cart">
          <div className="shopPage">
            <nav className="topNav">
              <div className="brandMark">Digital Services</div>

              <div className="navRight">
                {user ? (
                  <>
                    <span>{user.email}</span>
                    <button className="navBtn" onClick={logout}>
                      <LogOut />
                    </button>
                  </>
                ) : (
                  <button className="navBtn" onClick={() => setAuthOpen(true)}>
                    Login
                  </button>
                )}

                <CartToggle onClick={() => setDrawerOpen(true)} />
              </div>
            </nav>

            <Routes>
              <Route path="/" element={<ProductsHome />} />
              <Route path="/product/:id" element={<ProductDetailsRoute />} />
              <Route path="/success" element={<SuccessPage />} />
            </Routes>

            <CartDrawer
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              onCheckout={handleCheckout}
            />
            <CheckoutModal
              open={checkoutOpen}
              onClose={() => setCheckoutOpen(false)}
            />
            <AuthModal
              open={authOpen}
              onClose={() => setAuthOpen(false)}
            />
          </div>
        </CartProvider>
    </BrowserRouter>
  );
}

export default App;
