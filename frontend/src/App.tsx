import { useState } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { CartProvider, CartDrawer, CartToggle } from "./cart";
import type { Product } from "./types/types";
import "./App.css";
import { ProductDetailsPage } from "./product/ProductDetailsPage.tsx";
import { CheckoutModal } from "./cart/CartComponent.tsx";

// Demo products
const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Brand Identity Design",
    price: 0,
    image:
      "https://puakrabhbhosdpyxfsfk.supabase.co/storage/v1/object/public/images/Hillside%2017.png",
  },

  {
    id: "p2",
    name: "Portfolio Website",
    price: 0,
    image:
      "https://puakrabhbhosdpyxfsfk.supabase.co/storage/v1/object/public/images/webiste-02.png",
  },
  {
    id: "p3",
    name: "User Interface Design UI",
    price: 0,
    image:
      "https://puakrabhbhosdpyxfsfk.supabase.co/storage/v1/object/public/images/Ui.png",
  },
  {
    id: "p4",
    name: "Portfolio Website Template",
    price: 149,
    image:
      "https://puakrabhbhosdpyxfsfk.supabase.co/storage/v1/object/public/images/webiste03.png",
  },
];

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
          <span className="cardBadge">
            {product.name.includes("UI")
              ? "UI Design"
              : product.name.includes("Brand")
                ? "Graphic Design"
                : "Web Development"}
          </span>
          {/* <div className="cardMeta">
            <button className="pricePill" type="button">
              {product.price === 0 ? "Pre-Order" : `${product.price} SAR`}
            </button>
          </div> */}
        </div>

        <div className="cardFooter">
          <div className="cardFooterPrice">
            {product.price === 0 ? "Pre-Odredr" : `${product.price} SAR`}
          </div>
        </div>
      </div>
    </article>
  );
}

function ProductsHome() {
  const navigate = useNavigate();

  return (
    <main className="productsGrid">
      {PRODUCTS.map((p) => (
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
  const product = PRODUCTS.find((p) => p.id === id);

  if (!product) return <div style={{ padding: 16 }}>Product not found.</div>;

  return <ProductDetailsPage product={product} />;
}

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleCheckout = () => {
    setCheckoutOpen(true);
  };

  return (
    <BrowserRouter>
      <CartProvider apiBase="http://localhost:4000/api/cart" userId="user_123">
        <div className="shopPage">
          <nav className="topNav">
            <div className="brandMark">Services</div>

            <div className="navRight">
              <CartToggle onClick={() => setDrawerOpen(true)} />
            </div>
          </nav>

          <Routes>
            <Route path="/" element={<ProductsHome />} />
            <Route path="/product/:id" element={<ProductDetailsRoute />} />
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
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
