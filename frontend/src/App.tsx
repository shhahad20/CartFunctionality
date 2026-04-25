import { useEffect, useState } from "react";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import { CartProvider, CartDrawer, CartToggle } from "./cart";
import { useAuth } from "./auth/AuthProvider";
import type { Product } from "./types/types";
import "./App.css";
import { ProductDetailsPage } from "./product/ProductDetailsPage.tsx";
import { CheckoutModal } from "./cart/CartComponent.tsx";
import SuccessPage from "./components/SuccessPage.tsx";
import AuthPage from "./components/AuthPage.tsx";
import { Loader, LogOut, UserRound } from "lucide-react";
import PasswordPage from "./components/ResetPassword.tsx";
import { CART_ENDPOINTS, PRODUCT_ENDPOINTS } from "../api/index.ts";
import CanceledPage from "./components/Canceled.tsx";
import ConfirmPage from "./components/ConfirmEmail.tsx";
import { Footer } from "./components/Footer.tsx";
import { useProducts } from "./hooks/products.tsx";

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

// const STATUS_OPTIONS = ["active", "inactive", "pending"];
const SORT_OPTIONS = [
  { label: "Newest", value: "created_at", order: "desc" },
  { label: "Oldest", value: "created_at", order: "asc" },
  { label: "Name A–Z", value: "name", order: "asc" },
  { label: "Name Z–A", value: "name", order: "desc" },
];

function ProductsHome() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const { products, meta, loading, error, filters, setFilters } =
    useProducts();

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(e.target.value);
    const selected = SORT_OPTIONS[index];

    if (selected) {
      setFilters((prev) => ({
        ...prev,
        sortBy: selected.value,
        order: selected.order as 'asc' | 'desc',
        page: 1,
      }));
    }
  };

  if (loading) return <p style={{ padding: 16 }}>Loading products...</p>;
  if (error) return <p style={{ padding: 16, color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      {/* Search + Filter + Sort Bar */}
      <div className="filtersBar">
        <input
          type="text"
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="searchInput"
        />
        <button className="searchBtn" onClick={handleSearch}>
          Search
        </button>

        {/* <select
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="filterSelect"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select> */}

        <select onChange={handleSortChange} className="filterSelect">
          {SORT_OPTIONS.map((opt, i) => (
            <option key={i} value={i}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <p style={{ padding: 16 }}>No products found.</p>
      ) : (
        <main className="productsGrid">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onOpen={() => navigate(`/product/${p.id}`)}
            />
          ))}
        </main>
      )}

      {/* Pagination */}
      {(meta?.totalPages ?? 0) > 1 && (
        <div className="pagination">
          <button
            disabled={filters.page === 1}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
            }
          >
            Prev
          </button>
          <span>
            {filters.page} / {meta.totalPages}
          </span>
          <button
            disabled={filters.page === meta.totalPages}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
            }
          >
            Next
          </button>
        </div>
      )}
    </div>
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

  const navigate = useNavigate();
  const { user, logout, initialized } = useAuth();

  const handleCheckout = () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setCheckoutOpen(true);
  };

  if (!initialized) return <Loader />;

  return (
    // <BrowserRouter>
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
                <span className="email-nav">{user.username}</span>
                <button className="navBtn" onClick={logout}>
                  <LogOut />
                </button>
              </>
            ) : (
              <button className="navBtn" onClick={() => navigate("/auth")}>
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
          <Route path="/cancel" element={<CanceledPage />} />
          <Route path="/confirm-email" element={<ConfirmPage />} />
          <Route path="/password" element={<PasswordPage />} />
          <Route path="/auth" element={<AuthPage />} />
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
      </div>
      <Footer />
    </CartProvider>
    // </BrowserRouter>
  );
}

export default App;
