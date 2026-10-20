
import { useEffect, useState } from "react";
import {
  Link,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import "./App.css";
import "./AdminManagement.css";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import TrackOrder from "./pages/TrackOrder";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSellers from "./pages/AdminSellers";

import SellerRegister from "./pages/SellerRegister";
import SellerDashboard from "./pages/SellerDashboard";
import SellerProducts from "./pages/SellerProducts";
import SellerAddProduct from "./pages/SellerAddProduct";
import CustomerManagement from "./pages/CustomerManagement";

import products from "./data/products";
import { useOrders } from "./context/OrderContext";
import OffersCoupons from "./pages/OffersCoupons";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerRegister from "./pages/CustomerRegister";

function LandingPage() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMouse({
        x: event.clientX,
        y: event.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      className="landing-page"
      style={{
        "--mouse-x": `${mouse.x}px`,
        "--mouse-y": `${mouse.y}px`,
      }}
    >
      <nav className="landing-navbar">
        <Link to="/" className="landing-logo">
          ZOVIA
        </Link>

        <div className="landing-nav-links">
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="/cart">Cart</Link>
        </div>
      </nav>

      <main className="landing-hero">
        <section className="landing-hero-content">
          <span className="landing-badge">NEW COLLECTION</span>

          <h1>
            Style.
            <br />
            Shop.
            <br />
            <span>Simplified.</span>
          </h1>

          <p>
            Discover carefully selected fashion,
            beauty and everyday essentials designed
            to make your style feel effortless.
          </p>

          <div className="landing-buttons">
            <Link to="/shop" className="landing-primary-button">
              EXPLORE ZOVIA <span>→</span>
            </Link>

            <Link to="/shop" className="landing-secondary-button">
              SHOP COLLECTION
            </Link>
          </div>

          <div className="landing-stats">
            <div>
              <strong>30+</strong>
              <span>Products</span>
            </div>

            <div>
              <strong>8</strong>
              <span>Categories</span>
            </div>

            <div>
              <strong>4.8</strong>
              <span>Rating</span>
            </div>
          </div>
        </section>

        <section className="landing-visual">
          <div
            className="landing-orb landing-orb-one"
            style={{
              transform: `translate(${mouse.x * 0.01}px, ${mouse.y * 0.01}px)`,
            }}
          />

          <div
            className="landing-orb landing-orb-two"
            style={{
              transform: `translate(${mouse.x * -0.008}px, ${mouse.y * -0.008}px)`,
            }}
          />

          <div className="landing-main-card">
            <div className="landing-card-top">
              <span>ZOVIA</span>
              <span>01 / 04</span>
            </div>

            <div className="landing-fashion-image">
              <div className="landing-image-overlay">
                <span>CURATED FOR YOU</span>
              </div>
            </div>

            <div className="landing-card-bottom">
              <div>
                <small>FEATURED</small>
                <strong>Everyday Essentials</strong>
              </div>

              <Link to="/shop">→</Link>
            </div>
          </div>

          <div className="landing-floating-card landing-floating-card-one">
            <span>01</span>
            <div>
              <small>NEW</small>
              <strong>Fashion</strong>
            </div>
          </div>

          <div className="landing-floating-card landing-floating-card-two">
            <span>02</span>
            <div>
              <small>SHOP</small>
              <strong>Beauty</strong>
            </div>
          </div>
        </section>
      </main>

      <section className="landing-categories">
        <Link to="/shop?category=fashion">
          <span>01</span>
          <strong>Fashion</strong>
          <small>Explore</small>
        </Link>

        <Link to="/shop?category=makeup">
          <span>02</span>
          <strong>Makeup</strong>
          <small>Explore</small>
        </Link>

        <Link to="/shop?category=shoes">
          <span>03</span>
          <strong>Shoes</strong>
          <small>Explore</small>
        </Link>

        <Link to="/shop?category=bags">
          <span>04</span>
          <strong>Bags</strong>
          <small>Explore</small>
        </Link>

        <Link to="/shop?category=jewellery">
          <span>05</span>
          <strong>Jewellery</strong>
          <small>Explore</small>
        </Link>
      </section>
    </div>
  );
}

function ZoviaStockNotifications({ products = [] }) {
  const lowStockProducts = products.filter((product) => {
    if (
      product.stock === null ||
      product.stock === undefined ||
      product.stock === ""
    ) {
      return false;
    }

    const stock = Number(product.stock);
    return Number.isFinite(stock) && stock > 0 && stock <= 5;
  });

  const outOfStockProducts = products.filter((product) => {
    if (
      product.stock === null ||
      product.stock === undefined ||
      product.stock === ""
    ) {
      return false;
    }

    const stock = Number(product.stock);
    return Number.isFinite(stock) && stock <= 0;
  });

  if (!lowStockProducts.length && !outOfStockProducts.length) {
    return (
      <section className="zm-stock-notifications zm-stock-clear">
        <span className="zm-stock-notification-icon">✓</span>
        <div>
          <h3>Inventory looks good</h3>
          <p>No low-stock or out-of-stock products detected.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="zm-stock-notifications">
      <div className="zm-stock-notification-heading">
        <span className="zm-stock-notification-icon">⚠</span>
        <div>
          <h2>Stock Notifications</h2>
          <p>
            {lowStockProducts.length + outOfStockProducts.length} product(s)
            need attention
          </p>
        </div>
      </div>

      {lowStockProducts.map((product) => (
        <div
          className="zm-stock-notification-item"
          key={product._inventoryKey}
        >
          <div className="zm-stock-notification-product">
            <strong>{product._displayName}</strong>
            <span>Only {Number(product.stock)} unit(s) remaining</span>
          </div>
          <span className="zm-stock-notification-badge">LOW STOCK</span>
        </div>
      ))}

      {outOfStockProducts.map((product) => (
        <div
          className="zm-stock-notification-item"
          key={`out-${product._inventoryKey}`}
        >
          <div className="zm-stock-notification-product">
            <strong>{product._displayName}</strong>
            <span>This product is out of stock.</span>
          </div>
          <span className="zm-stock-out-badge">OUT OF STOCK</span>
        </div>
      ))}
    </section>
  );
}

// ADMIN MANAGEMENT PAGES

function AdminManagement() {
  const location = useLocation();
  const { orders = [] } = useOrders();

  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  const session = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("zovia-admin-session") || "null"
      );
    } catch {
      return null;
    }
  })();

  const isAdmin = session?.role === "super-admin";
  const isSeller = session?.role === "seller";
  const sellerId = session?.sellerId;
  const page = location.pathname;

  const readStorage = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch {
      return fallback;
    }
  };

  // Read latest saved products and inventory values.
  const sellerProducts = readStorage("zovia-seller-products", []);
  const inventoryOverrides = readStorage("zovia-inventory-overrides", {});
  const sellers = readStorage("zovia-sellers", []);

  const safeSellerProducts = Array.isArray(sellerProducts)
    ? sellerProducts
    : [];

  const safeProducts = Array.isArray(products) ? products : [];

  const allProducts = [...safeProducts, ...safeSellerProducts].map(
    (product, index) => {
      const productName = product.name || product.title || "ZOVIA Product";

      const key = String(
        product.id ??
          product._id ??
          product.productId ??
          `${product.sellerId || "catalog"}-${productName}-${index}`
      );

      const override = inventoryOverrides[key];

      return {
        ...product,
        _inventoryKey: key,
        _displayName: productName,
        stock: Object.prototype.hasOwnProperty.call(inventoryOverrides, key)
          ? override
          : product.stock,
      };
    }
  );

  const visibleProducts = isAdmin
    ? allProducts
    : isSeller && sellerId
      ? allProducts.filter(
          (product) => String(product.sellerId) === String(sellerId)
        )
      : [];

  const safeOrders = Array.isArray(orders) ? orders : [];

  const visibleOrders = isAdmin
    ? safeOrders
    : isSeller && sellerId
      ? safeOrders.filter(
          (order) =>
            String(order.sellerId) === String(sellerId) ||
            order.items?.some(
              (item) => String(item.sellerId) === String(sellerId)
            )
        )
      : [];

  const stockStatus = (stock) => {
    if (stock === null || stock === undefined || stock === "") {
      return "not-specified";
    }

    const quantity = Number(stock);

    if (!Number.isFinite(quantity)) return "not-specified";
    if (quantity <= 0) return "out-of-stock";
    if (quantity <= 5) return "low-stock";

    return "in-stock";
  };

  const statusLabels = {
    "in-stock": "In stock",
    "low-stock": "Low stock",
    "out-of-stock": "Out of stock",
    "not-specified": "Not set",
  };

  const money = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const changeStock = (product, amount) => {
    const current =
      product.stock === null ||
      product.stock === undefined ||
      product.stock === ""
        ? 0
        : Number(product.stock);

    if (!Number.isFinite(current)) return;

    const next = Math.max(0, current + amount);
    const saved = readStorage("zovia-inventory-overrides", {});

    const updated = {
      ...saved,
      [product._inventoryKey]: next,
    };

    try {
      localStorage.setItem(
        "zovia-inventory-overrides",
        JSON.stringify(updated)
      );

      setRefresh((value) => value + 1);
    } catch {
      window.alert("Stock could not be saved. Please try again.");
    }
  };

  // Refresh the inventory values after a stock change.
  void refresh;

  const filteredProducts = visibleProducts.filter((product) => {
    const name = String(product._displayName || "").toLowerCase();
    const category = String(product.category || "General").toLowerCase();
    const query = search.trim().toLowerCase();
    const status = stockStatus(product.stock);

    const matchesSearch =
      name.includes(query) || category.includes(query);

    const matchesFilter =
      stockFilter === "all" || status === stockFilter;

    return matchesSearch && matchesFilter;
  });

  const knownStock = visibleProducts.reduce((total, product) => {
    const stock = Number(product.stock);

    return product.stock !== "" &&
      product.stock !== null &&
      product.stock !== undefined &&
      Number.isFinite(stock)
      ? total + stock
      : total;
  }, 0);

  const lowStockCount = visibleProducts.filter(
    (product) => stockStatus(product.stock) === "low-stock"
  ).length;

  const outOfStockCount = visibleProducts.filter(
    (product) => stockStatus(product.stock) === "out-of-stock"
  ).length;

  if (!session || (!isAdmin && !isSeller)) {
    return (
      <main className="zovia-management zovia-access-denied">
        <div className="zm-access-card">
          <div className="zm-access-icon">🔒</div>
          <h1>Store management</h1>
          <p>
            Please sign in with your admin or seller account to continue.
          </p>
          <Link className="zm-primary-button" to="/admin/login">
            Go to login
          </Link>
        </div>
      </main>
    );
  }

 
const navigation = [
  { label: "Overview", path: "/admin/dashboard", icon: "◫" },
  { label: "Products", path: "/admin/products", icon: "▦" },
  { label: "Inventory", path: "/admin/inventory", icon: "▤" },
  { label: "Orders", path: "/admin/orders", icon: "▧" },

  ...(isAdmin
    ? [
        { label: "Sellers", path: "/admin/sellers", icon: "♙" },
        {
          label: "Offers & Coupons",
          path: "/admin/offers",
          icon: "%",
        },
      ]
    : []),
];


  const pageTitle =
    page === "/admin/products"
      ? "Products"
      : page === "/admin/orders"
        ? "Orders"
        : page === "/admin/sellers"
          ? "Sellers"
          : page === "/admin/dashboard"
            ? "Store overview"
            : "Inventory";

  const productImage = (product) =>
    product.image ||
    product.imageUrl ||
    (Array.isArray(product.images) ? product.images[0] : "") ||
    "";

  return (
    <main className="zovia-management">
      <header className="zm-topbar">
        <Link className="zm-brand" to="/">
          ZOVIA<span>•</span>
          <small>STORE MANAGEMENT</small>
        </Link>

        <div className="zm-account">
          <div className="zm-avatar">
            {isAdmin
              ? "A"
              : String(session.shopName || session.name || "S")
                  .charAt(0)
                  .toUpperCase()}
          </div>
          <div className="zm-account-copy">
            <strong>
              {isAdmin
                ? "Super Admin"
                : session.shopName || session.name || "Seller"}
            </strong>
            <span>{isAdmin ? "Full store access" : "Seller account"}</span>
          </div>
        </div>
      </header>

      <div className="zm-shell">
        <aside className="zm-sidebar">
          <p className="zm-sidebar-label">WORKSPACE</p>

          <nav className="zm-nav">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`zm-nav-link ${
                  page === item.path ? "active" : ""
                }`}
              >
                <span className="zm-nav-icon">{item.icon}</span>
                {item.label}
                {page === item.path && (
                  <span className="zm-nav-active-dot" />
                )}
              </Link>
            ))}
          </nav>

          <div className="zm-sidebar-note">
            <span className="zm-note-mark">✦</span>
            <strong>Keep your store ready.</strong>
            <p>
              Review stock levels regularly to keep products available.
            </p>
          </div>
        </aside>

        <section className="zm-main">
          <div className="zm-page-heading">
            <div>
              <div className="zm-breadcrumb">
                Workspace / {pageTitle}
              </div>
              <h1>{pageTitle}</h1>
              <p>
                {page === "/admin/inventory"
                  ? "Track product availability and update stock in one place."
                  : page === "/admin/orders"
                    ? "Review orders available to your account."
                    : page === "/admin/products"
                      ? "Browse the products available to your account."
                      : page === "/admin/sellers"
                        ? "Review registered seller accounts."
                        : "A quick view of your store."}
              </p>
            </div>
          </div>

          {/* INVENTORY */}

          {page === "/admin/inventory" && (
            <section className="zm-inventory">
              <div className="zm-summary-grid">
                <article className="zm-summary-card">
                  <div className="zm-summary-top">
                    <span className="zm-summary-icon lavender">▦</span>
                    <span className="zm-summary-caption">CATALOGUE</span>
                  </div>
                  <strong>{visibleProducts.length}</strong>
                  <span className="zm-summary-label">Total products</span>
                </article>

                <article className="zm-summary-card">
                  <div className="zm-summary-top">
                    <span className="zm-summary-icon blue">▤</span>
                    <span className="zm-summary-caption">QUANTITY</span>
                  </div>
                  <strong>{knownStock.toLocaleString("en-IN")}</strong>
                  <span className="zm-summary-label">
                    Known units in stock
                  </span>
                </article>

                <article className="zm-summary-card">
                  <div className="zm-summary-top">
                    <span className="zm-summary-icon amber">!</span>
                    <span className="zm-summary-caption">ATTENTION</span>
                  </div>
                  <strong>{lowStockCount}</strong>
                  <span className="zm-summary-label">
                    Low-stock products
                  </span>
                </article>

                <article className="zm-summary-card">
                  <div className="zm-summary-top">
                    <span className="zm-summary-icon rose">×</span>
                    <span className="zm-summary-caption">UNAVAILABLE</span>
                  </div>
                  <strong>{outOfStockCount}</strong>
                  <span className="zm-summary-label">Out of stock</span>
                </article>
              </div>

              <ZoviaStockNotifications products={visibleProducts} />

              <div className="zm-table-panel">
                <div className="zm-table-heading">
                  <div>
                    <h2>Product inventory</h2>
                    <p>
                      Showing {filteredProducts.length} of{" "}
                      {visibleProducts.length} products
                    </p>
                  </div>
                  <span className="zm-live-indicator">
                    <span /> Stock manager
                  </span>
                </div>

                <div className="zm-toolbar">
                  <label className="zm-search">
                    <span>⌕</span>
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search product or category..."
                      aria-label="Search products"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </label>

                  <label className="zm-filter">
                    <span>Stock status</span>
                    <select
                      value={stockFilter}
                      onChange={(event) => setStockFilter(event.target.value)}
                    >
                      <option value="all">All products</option>
                      <option value="in-stock">In stock</option>
                      <option value="low-stock">Low stock</option>
                      <option value="out-of-stock">Out of stock</option>
                      <option value="not-specified">Stock not set</option>
                    </select>
                  </label>
                </div>

                <div className="zm-table-scroll">
                  <table className="zm-inventory-table">
                    <thead>
                      <tr>
                        <th>PRODUCT</th>
                        <th>CATEGORY</th>
                        <th>PRICE</th>
                        <th>STOCK STATUS</th>
                        <th className="zm-stock-column">AVAILABLE UNITS</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredProducts.map((product) => {
                        const status = stockStatus(product.stock);
                        const image = productImage(product);

                        const quantity =
                          product.stock === null ||
                          product.stock === undefined ||
                          product.stock === ""
                            ? null
                            : Number(product.stock);

                        return (
                          <tr key={product._inventoryKey}>
                            <td>
                              <div className="zm-product-cell">
                                <div className="zm-product-thumb">
                                  {image ? (
                                    <img
                                      src={image}
                                      alt={product._displayName}
                                      loading="lazy"
                                    />
                                  ) : (
                                    <span>✧</span>
                                  )}
                                </div>

                                <div className="zm-product-copy">
                                  <strong>{product._displayName}</strong>
                                  <span>
                                    {product.sellerId
                                      ? `Seller ID: ${product.sellerId}`
                                      : "ZOVIA catalogue"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className="zm-category-pill">
                                {product.category || "General"}
                              </span>
                            </td>

                            <td>
                              <strong className="zm-price">
                                {money(product.price)}
                              </strong>
                            </td>

                            <td>
                              <span className={`zm-status ${status}`}>
                                <span className="zm-status-dot" />
                                {statusLabels[status]}
                              </span>
                            </td>

                            <td className="zm-stock-column">
                              <div className="zm-stock-control">
                                <button
                                  type="button"
                                  className="zm-stock-button"
                                  onClick={() => changeStock(product, -1)}
                                  disabled={quantity === 0}
                                  aria-label={`Decrease ${product._displayName} stock`}
                                  title="Decrease stock"
                                >
                                  −
                                </button>

                                <strong className="zm-stock-value">
                                  {quantity === null
                                    ? "—"
                                    : quantity.toLocaleString("en-IN")}
                                </strong>

                                <button
                                  type="button"
                                  className="zm-stock-button plus"
                                  onClick={() => changeStock(product, 1)}
                                  aria-label={`Increase ${product._displayName} stock`}
                                  title="Increase stock"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredProducts.length === 0 && (
                  <div className="zm-empty">
                    <span>⌕</span>
                    <h3>No matching products</h3>
                    <p>Try a different search term or stock filter.</p>
                    <button
                      type="button"
                      className="zm-secondary-button"
                      onClick={() => {
                        setSearch("");
                        setStockFilter("all");
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                )}

                <div className="zm-table-footer">
                  <span>
                    <span className="zm-footer-dot" />
                    Changes save automatically on this device
                  </span>
                  <span>{filteredProducts.length} item(s)</span>
                </div>
              </div>
            </section>
          )}

          {/* PRODUCTS — FIXED JSX AND ADD PRODUCT BUTTON */}

          {page === "/admin/products" && (
            <section className="zm-table-panel">
              <div className="zm-table-heading">
                <div>
                  <h2>Products</h2>
                  <p>
                    Showing {visibleProducts.length} product(s) available to
                    your account.
                  </p>
                </div>

                <div className="zm-products-actions">
                  <Link
                    className="zm-primary-button"
                    to="/seller/products/add"
                  >
                    + Add Product
                  </Link>

                  <Link
                    className="zm-secondary-button"
                    to="/admin/inventory"
                  >
                    Manage stock →
                  </Link>
                </div>
              </div>

              <div className="zm-table-scroll">
                <table className="zm-inventory-table">
                  <thead>
                    <tr>
                      <th>PRODUCT</th>
                      <th>CATEGORY</th>
                      <th>PRICE</th>
                      <th>STOCK</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleProducts.map((product) => (
                      <tr key={product._inventoryKey}>
                        <td>
                          <div className="zm-product-cell">
                            <div className="zm-product-thumb">
                              {productImage(product) ? (
                                <img
                                  src={productImage(product)}
                                  alt={product._displayName}
                                  loading="lazy"
                                />
                              ) : (
                                <span>✧</span>
                              )}
                            </div>

                            <div className="zm-product-copy">
                              <strong>{product._displayName}</strong>
                              <span>
                                {product.sellerId
                                  ? `Seller ID: ${product.sellerId}`
                                  : "ZOVIA catalogue"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {product.category || "General"}
                        </td>

                        <td>{money(product.price)}</td>

                        <td>
                          {product.stock === null ||
                          product.stock === undefined ||
                          product.stock === ""
                            ? "Not set"
                            : product.stock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {visibleProducts.length === 0 && (
                <div className="zm-empty">
                  <h3>No products found</h3>
                  <p>
                    Add a product to make it appear in this catalogue.
                  </p>
                  <Link
                    className="zm-primary-button"
                    to="/seller/products/add"
                  >
                    + Add your first product
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* ORDERS */}

          {page === "/admin/orders" && (
            <section className="zm-table-panel">
              <div className="zm-table-heading">
                <div>
                  <h2>Orders</h2>
                  <p>Orders available to your account</p>
                </div>
                <span className="zm-order-count">
                  {visibleOrders.length} order(s)
                </span>
              </div>

              {visibleOrders.length > 0 ? (
                <div className="zm-order-list">
                  {visibleOrders.map((order, index) => (
                    <article
                      className="zm-order-row"
                      key={order.id || order.orderId || order._id || index}
                    >
                      <div className="zm-order-icon">▧</div>

                      <div className="zm-order-main">
                        <strong>
                          {order.orderNumber ||
                            order.orderId ||
                            order.id ||
                            `Order ${index + 1}`}
                        </strong>
                        <span>
                          {order.customerName ||
                            order.customer?.name ||
                            order.email ||
                            "Customer order"}
                        </span>
                      </div>

                      <div className="zm-order-total">
                        <strong>
                          {money(
                            order.total ?? order.totalAmount ?? order.amount
                          )}
                        </strong>
                        <span>{order.status || "Processing"}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="zm-empty">
                  <span>▧</span>
                  <h3>No orders to display</h3>
                  <p>Orders matching this account will appear here.</p>
                </div>
              )}
            </section>
          )}

          {/* SELLERS */}

          {page === "/admin/sellers" && isAdmin && (
            <section className="zm-table-panel">
              <div className="zm-table-heading">
                <div>
                  <h2>Registered sellers</h2>
                  <p>Seller accounts saved on this device</p>
                </div>
                <span className="zm-order-count">
                  {Array.isArray(sellers) ? sellers.length : 0} seller(s)
                </span>
              </div>

              {Array.isArray(sellers) && sellers.length > 0 ? (
                <div className="zm-order-list">
                  {sellers.map((seller, index) => (
                    <article
                      className="zm-order-row"
                      key={seller.sellerId || seller.id || index}
                    >
                      <div className="zm-order-icon">♙</div>

                      <div className="zm-order-main">
                        <strong>
                          {seller.shopName || seller.name || "Seller"}
                        </strong>
                        <span>
                          {seller.sellerId ||
                            seller.id ||
                            "Seller ID unavailable"}
                        </span>
                      </div>

                      <span className="zm-status in-stock">
                        <span className="zm-status-dot" />
                        Registered
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="zm-empty">
                  <h3>No registered sellers yet</h3>
                  <p>New seller accounts will appear here.</p>
                </div>
              )}
            </section>
          )}

          {/* OVERVIEW */}

          {page === "/admin/dashboard" && (
            <>
              <section className="zm-summary-grid">
                <article className="zm-summary-card">
                  <div className="zm-summary-top">
                    <span className="zm-summary-icon lavender">▦</span>
                    <span className="zm-summary-caption">CATALOGUE</span>
                  </div>
                  <strong>{visibleProducts.length}</strong>
                  <span className="zm-summary-label">
                    Products available
                  </span>
                </article>

                <article className="zm-summary-card">
                  <div className="zm-summary-top">
                    <span className="zm-summary-icon blue">▧</span>
                    <span className="zm-summary-caption">ORDERS</span>
                  </div>
                  <strong>{visibleOrders.length}</strong>
                  <span className="zm-summary-label">
                    Orders available
                  </span>
                </article>

                <article className="zm-summary-card">
                  <div className="zm-summary-top">
                    <span className="zm-summary-icon amber">!</span>
                    <span className="zm-summary-caption">ATTENTION</span>
                  </div>
                  <strong>{lowStockCount}</strong>
                  <span className="zm-summary-label">
                    Low-stock products
                  </span>
                </article>

                <article className="zm-summary-card">
                  <div className="zm-summary-top">
                    <span className="zm-summary-icon rose">×</span>
                    <span className="zm-summary-caption">UNAVAILABLE</span>
                  </div>
                  <strong>{outOfStockCount}</strong>
                  <span className="zm-summary-label">Out of stock</span>
                </article>

                <div className="zm-dashboard-action">
                  <div>
                    <h2>Inventory needs a quick check?</h2>
                    <p>
                      Review stock levels and update quantities from one table.
                    </p>
                  </div>
                  <Link
                    className="zm-primary-button"
                    to="/admin/inventory"
                  >
                    Open inventory →
                  </Link>
                </div>
              </section>

              <ZoviaStockNotifications products={visibleProducts} />
            </>
          )}

          {![
            "/admin/inventory",
            "/admin/products",
            "/admin/orders",
            "/admin/sellers",
            "/admin/dashboard",
          ].includes(page) && (
            <section className="zm-table-panel">
              <div className="zm-empty">
                <h3>Management page not found</h3>
                <p>
                  Choose Inventory, Products or Orders from the sidebar.
                </p>
                <Link
                  className="zm-primary-button"
                  to="/admin/inventory"
                >
                  Open inventory
                </Link>
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

function CustomerRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


// MAIN APP


function App() {
  return (
    <Routes>
      {/* WEBSITE OPENS WITH LOGIN */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* PUBLIC CUSTOMER AUTH */}
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/register" element={<CustomerRegister />} />

      {/* CUSTOMER PAGES — LOGIN REQUIRED */}
      <Route
        path="/home"
        element={<CustomerRoute><Home /></CustomerRoute>}
      />
      <Route
        path="/shop"
        element={<CustomerRoute><Shop /></CustomerRoute>}
      />
      <Route
        path="/product/:productId"
        element={<CustomerRoute><ProductDetails /></CustomerRoute>}
      />
      <Route
        path="/wishlist"
        element={<CustomerRoute><Wishlist /></CustomerRoute>}
      />
      <Route
        path="/cart"
        element={<CustomerRoute><Cart /></CustomerRoute>}
      />
      <Route
        path="/checkout"
        element={<CustomerRoute><Checkout /></CustomerRoute>}
      />
      <Route
        path="/order-success/:orderId"
        element={<CustomerRoute><OrderSuccess /></CustomerRoute>}
      />
      <Route
        path="/orders"
        element={<CustomerRoute><Orders /></CustomerRoute>}
      />
      <Route
        path="/track-order/:orderId"
        element={<CustomerRoute><TrackOrder /></CustomerRoute>}
      />

      {/* ADMIN */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/dashboard" element={<AdminManagement />} />
      <Route path="/admin/products" element={<AdminManagement />} />
      <Route path="/admin/inventory" element={<AdminManagement />} />
      <Route path="/admin/orders" element={<AdminManagement />} />
      <Route path="/admin/sellers" element={<AdminManagement />} />
      <Route path="/admin/customers" element={<CustomerManagement />} />
      <Route path="/admin/offers" element={<OffersCoupons />} />

      {/* SELLER */}
      <Route path="/seller/register" element={<SellerRegister />} />
      <Route path="/seller/dashboard" element={<SellerDashboard />} />
      <Route path="/seller/products" element={<SellerProducts />} />
      <Route path="/seller/products/add" element={<SellerAddProduct />} />

      {/* UNKNOWN URL */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
