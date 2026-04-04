import type { Product } from "../types/types";
import { AddToCartButton } from "../cart";

export function ProductPage({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  // const category =
  //   product.name.includes("UI")
  //     ? "UI Design"
  //     : product.name.includes("Brand")
  //       ? "Graphic Design"
  //       : "Web Development";
  const tag = product.tag;
  console.log("🚀 ~ file: ProductPage.tsx:11 ~ ProductPage ~ tag:", tag);
  const priceLabel = product.price === 0 ? "Pre-Order" : `${product.price} SAR`;

  return (
    <div
      className="productPageOverlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} details`}
      onClick={onClose}
    >
      <div className="productPageModal" onClick={(e) => e.stopPropagation()}>
        <div className="productPageTop">
          <div className="productPageBadges">
            <span className="cardBadge">{tag}</span>
            <span className="pricePill productPagePrice">{priceLabel}</span>
          </div>
          <button className="productPageClose" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="productPageGrid">
          <div className="productPageMedia">
            {product.image && (
              <img src={product.image} alt={product.name} className="productPageImg" />
            )}
          </div>

          <div className="productPageDetails">
            <h2 className="productPageTitle">{product.name}</h2>
            <p className="productPageDescription">
              {product.description ?? "Detailed information will be available soon."}
            </p>

            <div className="productPageActions">
              <AddToCartButton product={product} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

