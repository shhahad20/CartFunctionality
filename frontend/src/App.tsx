import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { CartProvider, CartDrawer, CartToggle } from "./cart";
import { useAuth } from "./auth/AuthProvider";
import type { Product } from "./types/types";
import "./App.css";
import { ProductDetailsPage } from "./product/ProductDetailsPage.tsx";
import { CheckoutModal } from "./cart/CartComponent.tsx";
import SuccessPage from "./components/SuccessPage.tsx";
import { AuthModal } from "./components/AuthModal.tsx";
import { Loader, LogOut, UserRound } from "lucide-react";
import PasswordPage from "./components/ResetPassword.tsx";
import { CART_ENDPOINTS, PRODUCT_ENDPOINTS } from "../api/index.ts";  

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
    fetch(`${PRODUCT_ENDPOINTS.GET_ALL}`)
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

    fetch(`${PRODUCT_ENDPOINTS.GET_BY_ID(id)}`)
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

  const { user, logout, initialized } = useAuth();
  // const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      setAuthOpen(true); // force login before checkout
      return;
    }

    setCheckoutOpen(true);
  };

  if (!initialized) return <Loader />;

  return (
    <BrowserRouter>
      <CartProvider apiBase={CART_ENDPOINTS.GET_CART}>
        <div className="shopPage">
          <nav className="topNav">
            <div
              className="brandMark"
              // role="button"
              // tabIndex={0}
              // onClick={() => navigate("/")}
              // onKeyDown={(e) => {
              //   if (e.key === "Enter" || e.key === " ") navigate("/");
              // }}
            >
             <a href="/">Digital Services</a>
            </div>

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
                  <UserRound />
                </button>
              )}

              <CartToggle onClick={() => setDrawerOpen(true)} />
            </div>
          </nav>

          <Routes>
            <Route path="/" element={<ProductsHome />} />
            <Route path="/product/:id" element={<ProductDetailsRoute />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/password" element={<PasswordPage />} />
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
          <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
        </div>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
