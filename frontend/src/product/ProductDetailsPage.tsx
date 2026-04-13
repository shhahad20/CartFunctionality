import { Link } from "react-router-dom";
import type { Product } from "../types/types";
import { AddToCartButton } from "../cart";

export function ProductDetailsPage({ product }: { product: Product }) {
  const description = product.description;
  const tag = product.tag;
  const priceLabel = product.price === 0 ? "Pre-Order" : `${product.price} SAR`;

  return (
    <div className="productDetailsPage">
      <div className="productDetailsHeader">
        <Link className="productBackLink" to="/">
          ← Back
        </Link>
      </div>

      <div className="productDetailsGrid">
        <div className="productDetailsMedia">
          {product.image && (
            <img src={product.image} alt={product.name} className="productDetailsImg" />
          )}
        </div>

        <div className="productDetailsInfo">
          <div className="productDetailsBadges">
            <span className="cardBadge">{tag}</span>
            <span className="pricePill productDetailsPrice">{priceLabel}</span>
          </div>

          <h1 className="productDetailsTitle">{product.name}</h1>
          <p className="productDetailsDescription">
            {description ?? "Detailed information will be available soon."}
          </p>

          <div className="productDetailsActions">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}

