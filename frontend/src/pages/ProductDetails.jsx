
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useOrders } from "../context/OrderContext";

import products from "../data/products";
import "./ProductDetails.css";

const fallbackImage =
  "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1000&q=90";

function readSellerProducts() {
  try {
    const savedProducts = JSON.parse(
      localStorage.getItem("zovia-seller-products") || "[]"
    );

    return Array.isArray(savedProducts) ? savedProducts : [];
  } catch {
    return [];
  }
}

function normalizeProduct(item, index, source) {
  return {
    ...item,
    id: String(
      item.id ?? item._id ?? item.productId ?? `${source}-${index}`
    ),
    name: item.name || item.title || "ZOVIA Collection",
    price: Number(item.price) || 0,
    rating: Number(item.rating) || 0,
    category: String(item.category || "fashion").toLowerCase(),
    image:
      item.image ||
      item.imageUrl ||
      item.thumbnail ||
      item.img ||
      fallbackImage,
    description:
      item.description ||
      "Elevate your everyday style with this carefully selected ZOVIA product. Designed with quality, comfort and modern style in mind.",
    stock: Number.isFinite(Number(item.stock))
      ? Number(item.stock)
      : null,
  };
}

function formatReviewDate(review) {
  const value =
    review.submittedAt ||
    review.createdAt ||
    review.date;

  if (!value) return "Recently";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ProductDetails() {
  const navigate = useNavigate();
  const { productId } = useParams();

  const { addToCart } = useCart();

  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useWishlist();

  const {
    productReviews = [],
    getProductReviews,
  } = useOrders();

  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState("");
  const [dbProduct, setDbProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchProduct() {
      setIsLoading(true);
      setDbProduct(null);

      try {
        const response = await fetch(
          "http://localhost:5000/api/products"
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const productList = Array.isArray(data.products)
          ? data.products
          : Array.isArray(data)
            ? data
            : [];

        const found = productList.find(
          (item) =>
            String(item._id ?? item.id ?? item.productId) ===
            String(productId)
        );

        if (!cancelled && found) {
          setDbProduct(
            normalizeProduct(
              {
                ...found,
                id: String(
                  found._id ?? found.id ?? found.productId
                ),
              },
              0,
              "database"
            )
          );
        }
      } catch (error) {
        console.error("Product fetch error:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const allProducts = useMemo(() => {
    const originalProducts = products.map((item, index) =>
      normalizeProduct(item, index, "default")
    );

    const sellerProducts = readSellerProducts().map(
      (item, index) =>
        normalizeProduct(item, index, "seller")
    );

    const combined = [
      ...originalProducts,
      ...sellerProducts,
      ...(dbProduct ? [dbProduct] : []),
    ];

    const uniqueProducts = new Map();

    combined.forEach((item) => {
      uniqueProducts.set(String(item.id), item);
    });

    return Array.from(uniqueProducts.values());
  }, [dbProduct]);

  const product = allProducts.find(
    (item) => String(item.id) === String(productId)
  );

  // Get reviews belonging to this product only.
  const currentProductReviews = useMemo(() => {
    if (!product) return [];

    const currentId = String(
      product.id ?? product._id ?? product.productId ?? ""
    );

    let matchingReviews = [];

    if (typeof getProductReviews === "function") {
      matchingReviews = getProductReviews(currentId) || [];
    } else {
      matchingReviews = productReviews.filter(
        (review) =>
          String(review.productId) === currentId
      );
    }

    // Fallback for older reviews saved with a different ID format.
    if (matchingReviews.length === 0) {
      const normalizeName = (name) =>
        String(name || "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ");

      matchingReviews = productReviews.filter(
        (review) =>
          normalizeName(review.productName) ===
          normalizeName(product.name)
      );
    }

    // Avoid displaying duplicate reviews.
    const uniqueReviews = new Map();

    matchingReviews.forEach((review, index) => {
      const key =
        review.id ??
        `${review.orderId || "review"}-${review.productId}-${review.submittedAt || review.date || index}`;

      uniqueReviews.set(String(key), review);
    });

    return Array.from(uniqueReviews.values()).sort(
      (a, b) =>
        new Date(b.submittedAt || b.createdAt || b.date || 0) -
        new Date(a.submittedAt || a.createdAt || a.date || 0)
    );
  }, [product, productReviews, getProductReviews]);

  const reviewCount = currentProductReviews.length;

  const averageRating =
    reviewCount > 0
      ? currentProductReviews.reduce(
          (total, review) =>
            total + Number(review.rating || 0),
          0
        ) / reviewCount
      : 0;

  const roundedRating = Number(averageRating.toFixed(1));

  const ratingBreakdown = [5, 4, 3, 2, 1].map(
    (rating) => {
      const count = currentProductReviews.filter(
        (review) => Number(review.rating) === rating
      ).length;

      return {
        rating,
        count,
        percentage:
          reviewCount > 0
            ? Math.round((count / reviewCount) * 100)
            : 0,
      };
    }
  );

  const similarProducts = useMemo(() => {
    if (!product) return [];

    const sameCategory = allProducts.filter(
      (item) =>
        String(item.id) !== String(product.id) &&
        item.category === product.category
    );

    const otherProducts = allProducts.filter(
      (item) =>
        String(item.id) !== String(product.id) &&
        item.category !== product.category
    );

    return [...sameCategory, ...otherProducts].slice(0, 4);
  }, [allProducts, product]);

  if (!product && isLoading) {
    return (
      <div className="product-not-found">
        <h2>Loading product...</h2>
        <p>Please wait while we load the product details.</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <div className="not-found-icon">🛍️</div>
        <h1>Product Not Found</h1>
        <p>
          Sorry, we couldn't find this product. Please return to
          the shop and try again.
        </p>
        <button onClick={() => navigate("/shop")}>
          Back to Shop
        </button>
      </div>
    );
  }

  const wishlistActive = isInWishlist(product.id);

  const handleWishlist = () => {
    if (wishlistActive) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = () => {
    if (product.stock !== null && product.stock < 1) {
      setCartMessage("Sorry, this product is out of stock.");
      return;
    }

    if (product.stock !== null && quantity > product.stock) {
      setCartMessage(
        `Only ${product.stock} item(s) are currently available.`
      );
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }

    setCartMessage("Product added to your cart!");
  };

  const handleBuyNow = () => {
    if (product.stock !== null && product.stock < 1) {
      setCartMessage("Sorry, this product is out of stock.");
      return;
    }

    if (product.stock !== null && quantity > product.stock) {
      setCartMessage(
        `Only ${product.stock} item(s) are currently available.`
      );
      return;
    }

    navigate("/checkout", {
      state: {
        buyNowProduct: {
          ...product,
          quantity,
        },
      },
    });
  };

  const productBadge =
    product.isNew || product.collection === "new"
      ? "NEW ARRIVAL"
      : product.isBestSeller ||
          product.collection === "bestsellers"
        ? "BESTSELLER"
        : product.isPopular ||
            product.collection === "popular"
          ? "POPULAR"
          : "ZOVIA PICK";

  return (
    <div className="product-details-page">
      <nav className="details-navbar">
        <div
          className="details-logo"
          onClick={() => navigate("/home")}
        >
          ZOVIA
        </div>

        <div className="details-nav-links">
          <span onClick={() => navigate("/home")}>Home</span>
          <span onClick={() => navigate("/shop")}>Shop</span>
          <span
            onClick={() =>
              navigate("/shop?collection=bestsellers")
            }
          >
            Best Sellers
          </span>
          <span onClick={() => navigate("/wishlist")}>
            Wishlist
          </span>
        </div>

        <div className="details-nav-actions">
          <button
            onClick={() => navigate("/shop")}
            aria-label="Search"
          >
            ⌕
          </button>
          <button
            onClick={() => navigate("/wishlist")}
            aria-label="Wishlist"
          >
            ♡
          </button>
          <button
            onClick={() => navigate("/cart")}
            aria-label="Cart"
          >
            🛒
          </button>
        </div>
      </nav>

      <div className="product-breadcrumb">
        <span onClick={() => navigate("/home")}>Home</span>
        <b> / </b>
        <span onClick={() => navigate("/shop")}>Shop</span>
        <b> / </b>
        <span>{product.name}</span>
      </div>

      <main className="product-main">
        <section className="product-gallery">
          <div className="main-product-image">
            <img
              src={product.image}
              alt={product.name}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = fallbackImage;
              }}
            />
            <span className="detail-badge">
              {productBadge}
            </span>
          </div>
        </section>

        <section className="product-info-details">
          <p className="detail-category">{product.category}</p>
          <h1>{product.name}</h1>

          {product.shopName && (
            <p className="seller-shop-name">
              Sold by <strong>{product.shopName}</strong>
            </p>
          )}

          <div className="detail-rating-row">
            <div className="stars">
              {"★".repeat(
                reviewCount > 0
                  ? Math.round(averageRating)
                  : 0
              )}
              <span>
                {"★".repeat(
                  5 -
                    (reviewCount > 0
                      ? Math.round(averageRating)
                      : 0)
                )}
              </span>
            </div>

            <strong>
              {reviewCount > 0 ? roundedRating.toFixed(1) : "—"}
            </strong>

            <span className="review-count">
              {reviewCount}{" "}
              {reviewCount === 1 ? "Review" : "Reviews"}
            </span>
          </div>

          <div className="detail-price">
            ₹{product.price.toLocaleString("en-IN")}
          </div>

          <p className="tax-note">Inclusive of all taxes</p>

          <div className="detail-description">
            <h3>About this product</h3>
            <p>{product.description}</p>
          </div>

          {product.stock !== null && (
            <div className="product-stock-info">
              {product.stock > 0
                ? `${product.stock} item(s) available`
                : "Currently out of stock"}
            </div>
          )}

          <div className="delivery-box">
            <div className="delivery-icon">🚚</div>
            <div>
              <strong>Free Delivery</strong>
              <p>Delivered within 3–5 business days</p>
            </div>
          </div>

          <div className="quantity-section">
            <span>Quantity</span>

            <div className="quantity-control">
              <button
                onClick={() =>
                  setQuantity((current) =>
                    Math.max(1, current - 1)
                  )
                }
                aria-label="Decrease quantity"
              >
                −
              </button>

              <strong>{quantity}</strong>

              <button
                onClick={() =>
                  setQuantity((current) => {
                    if (product.stock !== null) {
                      return Math.min(
                        Math.max(1, product.stock),
                        current + 1
                      );
                    }

                    return current + 1;
                  })
                }
                disabled={
                  product.stock === 0 ||
                  (product.stock !== null &&
                    quantity >= product.stock)
                }
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <div className="product-action-row">
            <button
              className="add-details-cart"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              Add to Cart
            </button>

            <button
              className="buy-now-button"
              onClick={handleBuyNow}
              disabled={product.stock === 0}
            >
              Buy Now
            </button>

            <button
              className={`details-wishlist ${
                wishlistActive ? "active" : ""
              }`}
              onClick={handleWishlist}
              aria-label="Wishlist"
            >
              {wishlistActive ? "♥" : "♡"}
            </button>
          </div>

          {cartMessage && (
            <p className="product-cart-message" role="status">
              {cartMessage}
            </p>
          )}

          <div className="product-features">
            <div>
              <span>✓</span>
              <p>Premium Quality</p>
            </div>
            <div>
              <span>✓</span>
              <p>Easy Returns</p>
            </div>
            <div>
              <span>✓</span>
              <p>Secure Payment</p>
            </div>
          </div>
        </section>
      </main>

      {/* ACTUAL CUSTOMER REVIEWS */}
      <section className="reviews-section">
        <div className="section-heading">
          <p>CUSTOMER FEEDBACK</p>
          <h2>What Our Customers Say</h2>
          <span>
            Real experiences from ZOVIA shoppers
          </span>
        </div>

        <div className="reviews-summary">
          <div className="overall-rating">
            <strong>
              {reviewCount > 0
                ? roundedRating.toFixed(1)
                : "—"}
            </strong>

            <div className="big-stars">
              {"★".repeat(
                reviewCount > 0
                  ? Math.round(averageRating)
                  : 0
              )}
              <span>
                {"★".repeat(
                  5 -
                    (reviewCount > 0
                      ? Math.round(averageRating)
                      : 0)
                )}
              </span>
            </div>

            <span>
              {reviewCount > 0
                ? `Based on ${reviewCount} ${
                    reviewCount === 1 ? "review" : "reviews"
                  }`
                : "No customer reviews yet"}
            </span>
          </div>

          <div className="rating-bars">
            {ratingBreakdown.map((item) => (
              <div key={item.rating}>
                <span>{item.rating} ★</span>

                <div>
                  <i
                    style={{
                      width: `${item.percentage}%`,
                    }}
                  />
                </div>

                <b>{item.percentage}%</b>
              </div>
            ))}
          </div>
        </div>

        {currentProductReviews.length > 0 ? (
          <div className="reviews-grid">
            {currentProductReviews.map((review, index) => {
              const customerName =
                review.customerName ||
                review.name ||
                "ZOVIA Customer";

              const rating = Math.min(
                5,
                Math.max(0, Number(review.rating) || 0)
              );

              return (
                <article
                  className="review-card"
                  key={
                    review.id ||
                    `${review.orderId}-${review.productId}-${index}`
                  }
                >
                  <div className="review-top">
                    <div className="customer-avatar">
                      {customerName.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <h3>{customerName}</h3>
                      <span>Verified Customer</span>
                    </div>

                    <small>{formatReviewDate(review)}</small>
                  </div>

                  <div className="review-stars">
                    {"★".repeat(rating)}
                    <span>
                      {"★".repeat(5 - rating)}
                    </span>
                  </div>

                  <p>
                    {review.comment || "No written comment."}
                  </p>

                  {Array.isArray(review.photos) &&
                    review.photos.length > 0 && (
                      <div className="customer-review-photos">
                        {review.photos.map((photo, photoIndex) => (
                          <img
                            key={`${photoIndex}-${photo}`}
                            src={
                              typeof photo === "string"
                                ? photo
                                : photo.url || photo.image
                            }
                            alt={`Customer review ${photoIndex + 1}`}
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ))}
                      </div>
                    )}

                  {review.orderId && (
                    <div className="verified">
                      ✓ Verified Purchase
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="no-product-reviews">
            <h3>No reviews yet</h3>
            <p>
              Be the first to share your experience with{" "}
              {product.name}.
            </p>
          </div>
        )}
      </section>

      {/* SIMILAR PRODUCTS */}
      <section className="similar-section">
        <div className="section-heading">
          <p>YOU MAY ALSO LIKE</p>
          <h2>Similar Products</h2>
          <span>More styles selected for you</span>
        </div>

        <div className="similar-grid">
          {similarProducts.map((item) => (
            <article
              className="similar-card"
              key={item.id}
              onClick={() => navigate(`/product/${item.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  navigate(`/product/${item.id}`);
                }
              }}
            >
              <div className="similar-image">
                <img
                  src={item.image}
                  alt={item.name}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = fallbackImage;
                  }}
                />

                <span>
                  {item.isNew || item.collection === "new"
                    ? "NEW"
                    : item.isBestSeller ||
                        item.collection === "bestsellers"
                      ? "BESTSELLER"
                      : item.isPopular ||
                          item.collection === "popular"
                        ? "POPULAR"
                        : "ZOVIA"}
                </span>
              </div>

              <div className="similar-info">
                <p>{item.category}</p>
                <h3>{item.name}</h3>
                <div className="similar-rating">
                  ★ {item.rating || "—"}
                </div>

                <strong>
                  ₹{item.price.toLocaleString("en-IN")}
                </strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="details-footer">
        <strong>ZOVIA</strong>
        <span>Style. Shop. Simplified.</span>
      </footer>
    </div>
  );
}

export default ProductDetails;
