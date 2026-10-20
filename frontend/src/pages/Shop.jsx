import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useOrders } from "../context/OrderContext";
import products from "../data/products";
import "./Shop.css";

const categories = [
  { id: "all", name: "All Products" },
  { id: "fashion", name: "Fashion" },
  { id: "makeup", name: "Makeup" },
  { id: "skincare", name: "Skincare" },
  { id: "shoes", name: "Shoes" },
  { id: "bags", name: "Bags" },
  { id: "jewellery", name: "Jewellery" },
  { id: "watches", name: "Watches" },
  { id: "perfumes", name: "Perfumes" },
];

const fallbackImage =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80";

function readSellerProducts() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("zovia-seller-products") || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeId(value) {
  if (value && typeof value === "object") {
    return normalize(value._id ?? value.id ?? value.productId);
  }

  return normalize(value);
}

function getStock(item) {
  const rawStock = item?.stock ?? item?.quantity ?? item?.inventory;

  if (rawStock === undefined || rawStock === null || rawStock === "") {
    return null;
  }

  const stock = Number(rawStock);
  return Number.isFinite(stock) ? Math.max(0, stock) : null;
}

function formatProduct(item, index, source = "default") {
  const rawTag = String(item.tag || item.label || "").toLowerCase();
  const category = String(item.category || "fashion")
    .toLowerCase()
    .trim();

  return {
    ...item,
    id: String(item._id || item.id || `${source}-${index}`),
    name: item.name || item.title || "ZOVIA Collection",
    price: Number(item.price) || 0,
    rating: Number(item.rating) || 4.5,
    category,
    image:
      item.image ||
      item.imageUrl ||
      item.thumbnail ||
      item.img ||
      fallbackImage,
    stock: getStock(item),
    isNew:
      item.isNew === true ||
      item.isNewArrival === true ||
      rawTag.includes("new arrival") ||
      rawTag === "new",
    isBestSeller:
      item.isBestSeller === true ||
      item.bestSeller === true ||
      rawTag.includes("bestseller") ||
      rawTag.includes("best seller"),
    isPopular: item.isPopular === true || rawTag.includes("popular"),
    createdAt: item.createdAt || item.created_at || "",
    source,
  };
}

function getProductBadge(product) {
  if (product.stock === 0) {
    return { text: "OUT OF STOCK", className: "tag-out-of-stock" };
  }

  if (product.isBestSeller) {
    return { text: "BESTSELLER", className: "tag-bestseller" };
  }

  if (product.isNew) {
    return { text: "NEW ARRIVAL", className: "tag-new" };
  }

  if (product.isPopular) {
    return { text: "POPULAR", className: "tag-popular" };
  }

  return null;
}

function Shop() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const cart = useCart();
  const wishlist = useWishlist();
  const { productReviews = [] } = useOrders();

  const [sellerProducts, setSellerProducts] = useState(() =>
    readSellerProducts()
  );
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  const activeCollection = (
    searchParams.get("collection") || "all"
  ).toLowerCase();

  useEffect(() => {
    let active = true;

    const refreshSellerProducts = () => {
      if (active) {
        setSellerProducts(readSellerProducts());
      }
    };

    const fetchBackendProducts = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/products");

        if (!response.ok) {
          throw new Error(`Products request failed: ${response.status}`);
        }

        const data = await response.json();
        const backendProducts = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : [];

        if (active) {
          setSellerProducts((current) => {
            const combined = new Map();

            [...current, ...backendProducts].forEach((item, index) => {
              const id = String(item._id || item.id || `seller-${index}`);
              const previous = combined.get(id);

              combined.set(id, {
                ...(previous || {}),
                ...item,
                id,
              });
            });

            return Array.from(combined.values());
          });
        }
      } catch (error) {
        console.error("Backend products fetch failed:", error);
      }
    };

    const handleStorage = () => {
      refreshSellerProducts();
      fetchBackendProducts();
    };

    window.addEventListener("focus", handleStorage);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("zovia-products-updated", handleStorage);

    fetchBackendProducts();

    const interval = window.setInterval(fetchBackendProducts, 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleStorage);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("zovia-products-updated", handleStorage);
    };
  }, []);

  const allProducts = useMemo(() => {
    const combined = new Map();

    (Array.isArray(products) ? products : []).forEach((item, index) => {
      const product = formatProduct(item, index, "default");
      combined.set(String(product.id), product);
    });

    sellerProducts.forEach((item, index) => {
      const product = formatProduct(item, index, "seller");
      const existing = combined.get(String(product.id));

      combined.set(String(product.id), {
        ...(existing || {}),
        ...product,
      });
    });

    return Array.from(combined.values());
  }, [sellerProducts]);

  const getReviewsForProduct = (product) => {
    const possibleIds = [
      product.id,
      product._id,
      product.productId,
    ]
      .map(normalizeId)
      .filter(Boolean);

    const matchedById = productReviews.filter((review) =>
      possibleIds.includes(normalizeId(review.productId))
    );

    if (matchedById.length > 0) {
      return matchedById;
    }

    const productName = normalize(product.name);

    if (!productName) {
      return [];
    }

    return productReviews.filter(
      (review) => normalize(review.productName) === productName
    );
  };

  const collectionProducts = useMemo(() => {
    const result = [...allProducts];

    if (activeCollection === "new" || activeCollection === "new-arrivals") {
      const explicitlyNew = result.filter((product) => {
        const tag = String(product.tag || product.label || "").toLowerCase();

        return (
          product.isNew === true ||
          product.isNewArrival === true ||
          tag.includes("new") ||
          tag.includes("arrival")
        );
      });

      if (explicitlyNew.length > 0) {
        return explicitlyNew;
      }

      return result
        .sort((a, b) => {
          const dateA = Date.parse(a.createdAt || "");
          const dateB = Date.parse(b.createdAt || "");

          if (Number.isFinite(dateA) && Number.isFinite(dateB)) {
            return dateB - dateA;
          }

          if (Number.isFinite(dateA)) return -1;
          if (Number.isFinite(dateB)) return 1;

          return 0;
        })
        .slice(0, 8);
    }

    if (
      activeCollection === "bestsellers" ||
      activeCollection === "best-sellers"
    ) {
      const bestsellers = result.filter((product) => product.isBestSeller);

      return bestsellers.length
        ? bestsellers
        : result.sort((a, b) => b.rating - a.rating).slice(0, 8);
    }

    if (activeCollection === "popular") {
      const popular = result.filter(
        (product) => product.isPopular || product.rating >= 4.7
      );

      return popular.length
        ? popular
        : result.sort((a, b) => b.rating - a.rating).slice(0, 8);
    }

    return result;
  }, [allProducts, activeCollection]);

  const filteredProducts = useMemo(() => {
    let result = [...collectionProducts];

    if (activeCategory !== "all") {
      result = result.filter(
        (product) => product.category === activeCategory
      );
    }

    if (search.trim()) {
      const term = search.trim().toLowerCase();

      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          product.category.toLowerCase().includes(term) ||
          String(product.shopName || "").toLowerCase().includes(term)
      );
    }

    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      result.sort((a, b) => {
        const reviewsA = getReviewsForProduct(a);
        const reviewsB = getReviewsForProduct(b);

        const ratingA = reviewsA.length
          ? reviewsA.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
            reviewsA.length
          : 0;

        const ratingB = reviewsB.length
          ? reviewsB.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
            reviewsB.length
          : 0;

        return ratingB - ratingA;
      });
    }

    return result;
  }, [collectionProducts, activeCategory, search, sortBy, productReviews]);

  const collectionTitles = {
    new: "New Arrivals",
    "new-arrivals": "New Arrivals",
    bestsellers: "Best Sellers",
    "best-sellers": "Best Sellers",
    popular: "Popular Products",
  };

  const pageTitle = collectionTitles[activeCollection] || "All Products";

  const changeCollection = (collection) => {
    setActiveCategory("all");
    setSearch("");
    setSortBy("featured");

    setSearchParams(
      collection === "all" ? {} : { collection },
      { replace: false }
    );
  };

  const addToCart = (product) => {
    if (product.stock === 0) {
      window.alert("This product is currently out of stock.");
      return;
    }

    if (typeof cart?.addToCart === "function") {
      cart.addToCart(product);
    } else {
      window.alert("Cart action is not available. Please check CartContext.");
    }
  };

  const isInWishlist = (product) => {
    const items =
      wishlist?.items || wishlist?.wishlist || wishlist?.wishlistItems || [];

    if (typeof wishlist?.isInWishlist === "function") {
      return wishlist.isInWishlist(product.id);
    }

    return items.some(
      (item) => String(item.id || item._id) === String(product.id)
    );
  };

  const toggleWishlist = (product) => {
    if (typeof wishlist?.toggleWishlist === "function") {
      wishlist.toggleWishlist(product);
    } else if (isInWishlist(product)) {
      if (typeof wishlist?.removeFromWishlist === "function") {
        wishlist.removeFromWishlist(product.id);
      } else if (typeof wishlist?.removeItem === "function") {
        wishlist.removeItem(product.id);
      }
    } else if (typeof wishlist?.addToWishlist === "function") {
      wishlist.addToWishlist(product);
    } else if (typeof wishlist?.addItem === "function") {
      wishlist.addItem(product);
    }
  };

  return (
    <div className="shop-page">
      <nav className="shop-navbar">
        <Link to="/home" className="shop-logo">
          ZOVIA
        </Link>

        <div className="shop-nav-links">
          <Link to="/home">Home</Link>

          <Link
            to="/shop"
            className={activeCollection === "all" ? "active" : ""}
            onClick={() => changeCollection("all")}
          >
            Shop
          </Link>

          <Link
            to="/shop?collection=new"
            className={
              activeCollection === "new" ||
              activeCollection === "new-arrivals"
                ? "active"
                : ""
            }
            onClick={() => changeCollection("new")}
          >
            New Arrivals
          </Link>

          <Link
            to="/shop?collection=bestsellers"
            className={
              activeCollection === "bestsellers" ||
              activeCollection === "best-sellers"
                ? "active"
                : ""
            }
            onClick={() => changeCollection("bestsellers")}
          >
            Best Sellers
          </Link>

          <Link
            to="/shop?collection=popular"
            className={activeCollection === "popular" ? "active" : ""}
            onClick={() => changeCollection("popular")}
          >
            Popular
          </Link>
        </div>

        <div className="shop-nav-actions">
          <button
            type="button"
            aria-label="Wishlist"
            title="Wishlist"
            onClick={() => navigate("/wishlist")}
          >
            ♡
          </button>

          <button
            type="button"
            aria-label="Cart"
            title="Cart"
            onClick={() => navigate("/cart")}
          >
            🛍
          </button>

          <button
            type="button"
            aria-label="My Orders"
            title="My Orders"
            onClick={() => navigate("/orders")}
          >
            ▤
          </button>
        </div>
      </nav>

      <section className="shop-header">
        <div>
          <p className="shop-eyebrow">THE ZOVIA EDIT</p>
          <h1>
            Discover
            <br />
            <span>{pageTitle}</span>
          </h1>
          <p>
            Thoughtfully picked styles for your everyday moments. Find your
            next favourite with ZOVIA.
          </p>
        </div>
      </section>

      <main className="shop-content">
        <aside className="shop-sidebar">
          <div className="sidebar-heading">
            <h3>Categories</h3>
          </div>

          <div className="category-list">
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={`category-button ${
                  activeCategory === category.id ? "active" : ""
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                <span>{category.name}</span>
                <span className="category-arrow">›</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="products-section">
          <div className="products-top">
            <div>
              <p className="results-label">CURATED FOR YOU</p>
              <h2>{pageTitle}</h2>
              <span className="product-count">
                {filteredProducts.length} products
              </span>
            </div>

            <div className="shop-controls">
              <label className="search-box">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  placeholder="Search products..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search products"
                />
              </label>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="empty-products">
              <div className="empty-icon">♡</div>
              <h3>No products found</h3>
              <p>Try another category or search for something else.</p>

              <button
                type="button"
                onClick={() => {
                  setActiveCategory("all");
                  setSearch("");
                  setSortBy("featured");
                  changeCollection("all");
                }}
              >
                View All Products
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => {
                const badge = getProductBadge(product);
                const wished = isInWishlist(product);
                const outOfStock = product.stock === 0;
                const reviews = getReviewsForProduct(product);

                const averageReviewRating =
                  reviews.length > 0
                    ? (
                        reviews.reduce(
                          (total, review) =>
                            total + Number(review.rating || 0),
                          0
                        ) / reviews.length
                      ).toFixed(1)
                    : null;

                return (
                  <article
                    className={`product-card ${
                      outOfStock ? "out-of-stock" : ""
                    }`}
                    key={product.id}
                  >
                    <div className="product-image-wrapper">
                      {badge && (
                        <span className={`product-tag ${badge.className}`}>
                          {badge.text}
                        </span>
                      )}

                      <button
                        type="button"
                        className="product-image-link"
                        onClick={() => navigate(`/product/${product.id}`)}
                        aria-label={`View ${product.name}`}
                      >
                        <img
                          className="product-image"
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = fallbackImage;
                          }}
                        />
                      </button>

                      <button
                        type="button"
                        className={`wishlist-button ${
                          wished ? "active" : ""
                        }`}
                        onClick={() => toggleWishlist(product)}
                        aria-label={
                          wished
                            ? `Remove ${product.name} from wishlist`
                            : `Add ${product.name} to wishlist`
                        }
                      >
                        {wished ? "♥" : "♡"}
                      </button>
                    </div>

                    <div className="product-info">
                      <p className="product-category">{product.category}</p>

                      <button
                        type="button"
                        className="product-name"
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        {product.name}
                      </button>

                      <p className="product-rating">
                        {reviews.length > 0 ? (
                          <>
                            <span>★</span> {averageReviewRating}
                            <span className="review-count">
                              {" "}({reviews.length}{" "}
                              {reviews.length === 1 ? "review" : "reviews"})
                            </span>
                          </>
                        ) : (
                          <span className="no-reviews">
                            ☆ No reviews yet
                          </span>
                        )}
                      </p>

                      <div className="product-bottom">
                        <span className="product-price">
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>

                        <button
                          type="button"
                          className="add-cart-button"
                          disabled={outOfStock}
                          onClick={() => addToCart(product)}
                        >
                          {outOfStock ? "Out of Stock" : "Add to Cart"}
                        </button>
                      </div>

                      {product.stock !== null && product.stock > 0 && (
                        <p className="product-stock">
                          {product.stock <= 5
                            ? `Only ${product.stock} left`
                            : `${product.stock} in stock`}
                        </p>
                      )}

                      {product.shopName && (
                        <p className="product-seller">
                          Sold by {product.shopName}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Shop;