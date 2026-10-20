
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import products from "../data/products";
import "./Wishlist.css";

const API_URL = "http://localhost:5000/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=85";

const getProductId = (product) =>
  String(product?.id ?? product?._id ?? product?.productId ?? "");

const getProductImage = (product) => {
  if (typeof product?.image === "string" && product.image.trim()) {
    return product.image;
  }

  if (typeof product?.imageUrl === "string" && product.imageUrl.trim()) {
    return product.imageUrl;
  }

  if (Array.isArray(product?.images) && product.images.length > 0) {
    const firstImage = product.images[0];

    if (typeof firstImage === "string") return firstImage;
    return firstImage?.url || firstImage?.imageUrl || FALLBACK_IMAGE;
  }

  return FALLBACK_IMAGE;
};

const readSellerProducts = () => {
  try {
    const saved = JSON.parse(
      localStorage.getItem("zovia-seller-products") || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

function Wishlist() {
  const navigate = useNavigate();
  const { wishlistItems = [], removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const [backendProducts, setBackendProducts] = useState([]);

  useEffect(() => {
    let active = true;

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products`);

        if (!response.ok) {
          throw new Error("Unable to fetch products");
        }

        const data = await response.json();

        const fetchedProducts = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : [];

        if (active) {
          setBackendProducts(fetchedProducts);
        }
      } catch (error) {
        console.error("Wishlist product fetch error:", error);
      }
    };

    fetchProducts();

    return () => {
      active = false;
    };
  }, []);

  const currentWishlistProducts = useMemo(() => {
    const sellerProducts = readSellerProducts();

    const allProducts = [
      ...products,
      ...sellerProducts,
      ...backendProducts,
    ];

    return wishlistItems
      .map((item) => {
        const wishlistId = getProductId(item);

        const matchedProduct = allProducts.find(
          (product) => getProductId(product) === wishlistId
        );

        // Use the saved wishlist product if it already has its details.
        const product =
          matchedProduct ||
          (item && typeof item === "object" && item.name ? item : null);

        if (!product) return null;

        return {
          ...product,
          id: getProductId(product) || wishlistId,
          image: getProductImage(product),
          name: product.name || "ZOVIA Product",
          price: Number(product.price ?? 0),
          rating: product.rating ?? 4.8,
          category: product.category || "Fashion",
        };
      })
      .filter(Boolean);
  }, [wishlistItems, backendProducts]);

  const handleAddToCart = (product) => {
    if (Number(product.stock) === 0) {
      alert("This product is currently out of stock.");
      return;
    }

    addToCart(product);
  };

  return (
    <div className="wishlist-page">
      <nav className="wishlist-navbar">
        <Link to="/" className="wishlist-logo">
          ZOVIA
        </Link>

        <div className="wishlist-nav-links">
          <Link to="/home">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/wishlist" className="wishlist-active">
            Wishlist
          </Link>
          <Link to="/cart">Cart</Link>
        </div>
      </nav>

      <section className="wishlist-hero">
        <span className="wishlist-eyebrow">
          YOUR SAVED PRODUCTS
        </span>

        <h1>
          My Wishlist <span>♡</span>
        </h1>

        <p>
          {wishlistItems.length === 0
            ? "Your favourite pieces will appear here."
            : `${wishlistItems.length} ${
                wishlistItems.length === 1 ? "product" : "products"
              } saved`}
        </p>
      </section>

      <main className="wishlist-container">
        {wishlistItems.length === 0 ? (
          <div className="wishlist-empty">
            <div className="empty-heart">♡</div>

            <h2>Your wishlist is waiting</h2>

            <p>
              Save the pieces you love and come back
              whenever you're ready.
            </p>

            <Link to="/shop" className="wishlist-shop-btn">
              Explore ZOVIA <span>→</span>
            </Link>
          </div>
        ) : currentWishlistProducts.length === 0 ? (
          <div className="wishlist-empty">
            <div className="empty-heart">♡</div>
            <h2>Loading your saved products</h2>
            <p>
              We are looking for your saved product details.
              Please refresh the page if they do not appear.
            </p>
            <Link to="/shop" className="wishlist-shop-btn">
              Continue Shopping <span>→</span>
            </Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {currentWishlistProducts.map((product) => (
              <article className="wishlist-card" key={product.id}>
                <div
                  className="wishlist-image-wrapper"
                  onClick={() => navigate(`/product/${product.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      navigate(`/product/${product.id}`);
                    }
                  }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    onError={(event) => {
                      if (event.currentTarget.src !== FALLBACK_IMAGE) {
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }
                    }}
                  />

                  <button
                    type="button"
                    className="wishlist-remove"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeFromWishlist(product.id);
                    }}
                    aria-label={`Remove ${product.name} from wishlist`}
                  >
                    ♥
                  </button>

                  {product.collection && (
                    <span className="wishlist-badge">
                      {product.collection === "new"
                        ? "NEW"
                        : product.collection === "bestsellers"
                          ? "BEST SELLER"
                          : "EVERYDAY"}
                    </span>
                  )}
                </div>

                <div className="wishlist-details">
                  <span className="wishlist-category">
                    {product.category}
                  </span>

                  <h2
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {product.name}
                  </h2>

                  <div className="wishlist-rating">
                    <span>★</span>
                    <strong>{product.rating}</strong>
                    <small>Highly Rated</small>
                  </div>

                  <div className="wishlist-price">
                    ₹{product.price.toLocaleString("en-IN")}
                  </div>

                  {Number.isFinite(Number(product.stock)) && (
                    <p className="product-stock">
                      {Number(product.stock) === 0
                        ? "Out of Stock"
                        : `${product.stock} in stock`}
                    </p>
                  )}

                  <div className="wishlist-actions">
                    <button
                      type="button"
                      className="wishlist-cart-btn"
                      onClick={() => handleAddToCart(product)}
                      disabled={
                        product.stock !== undefined &&
                        Number(product.stock) <= 0
                      }
                    >
                      Add to Cart <span>→</span>
                    </button>

                    <button
                      type="button"
                      className="wishlist-view-btn"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      View
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="wishlist-footer">
        <div className="wishlist-footer-brand">
          <strong>ZOVIA</strong>
          <span>Style. Shop. Simplified.</span>
        </div>

        <div className="wishlist-footer-links">
          <Link to="/shop">Shop</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/orders">My Orders</Link>
        </div>

        <p>© 2026 ZOVIA. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Wishlist;
