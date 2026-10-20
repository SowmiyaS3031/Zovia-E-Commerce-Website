
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useOrders } from "../context/OrderContext";
import products from "../data/products";
import "./AdminDashboard.css";

const readJSON = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const readArray = (key) => {
  const value = readJSON(key, []);
  return Array.isArray(value) ? value : [];
};

const getStock = (product) => {
  const value = product.stock ?? product.quantity;

  if (value === null || value === undefined || value === "") {
    return null;
  }

  const stock = Number(value);
  return Number.isFinite(stock) ? stock : null;
};

function AdminDashboard() {
  const navigate = useNavigate();
  const { orders = [] } = useOrders();

  const session = useMemo(
    () => readJSON("zovia-admin-session", null),
    []
  );

  const isSuperAdmin = session?.role === "super-admin";
  const isSeller = session?.role === "seller";
  const sellerId = session?.sellerId;

  const allProducts = useMemo(() => {
    const sellerProducts = readArray("zovia-seller-products");
    const inventoryOverrides = readJSON(
      "zovia-inventory-overrides",
      {}
    );

    const combined = [
      ...(Array.isArray(products) ? products : []),
      ...sellerProducts,
    ];

    return combined.map((product, index) => {
      const productName =
        product.name || product.title || "ZOVIA Product";

      // Use the same key format as the Inventory page.
      const inventoryKey = String(
        product.id ??
          product._id ??
          product.productId ??
          `${product.sellerId || "catalog"}-${productName}-${index}`
      );

      let stock = product.stock ?? product.quantity;

      // Current inventory format: { productKey: stockNumber }
      if (
        inventoryOverrides &&
        !Array.isArray(inventoryOverrides) &&
        Object.prototype.hasOwnProperty.call(
          inventoryOverrides,
          inventoryKey
        )
      ) {
        stock = inventoryOverrides[inventoryKey];
      }

      // Backward compatibility for older array-based saved data.
      if (Array.isArray(inventoryOverrides)) {
        const oldOverride = inventoryOverrides.find(
          (item) =>
            String(item.productId ?? item.id) === inventoryKey
        );

        if (oldOverride) {
          stock = oldOverride.stock;
        }
      }

      return {
        ...product,
        stock,
        _inventoryKey: inventoryKey,
        _displayName: productName,
      };
    });
  }, []);

  const visibleProducts = useMemo(() => {
    if (isSuperAdmin) {
      return allProducts;
    }

    if (isSeller && sellerId) {
      return allProducts.filter(
        (product) =>
          String(product.sellerId) === String(sellerId)
      );
    }

    return [];
  }, [allProducts, isSuperAdmin, isSeller, sellerId]);

  const safeOrders = Array.isArray(orders) ? orders : [];

  const visibleOrders = useMemo(() => {
    if (isSuperAdmin) {
      return safeOrders;
    }

    if (isSeller && sellerId) {
      return safeOrders.filter(
        (order) =>
          String(order.sellerId) === String(sellerId) ||
          order.items?.some(
            (item) =>
              String(item.sellerId) === String(sellerId)
          )
      );
    }

    return [];
  }, [safeOrders, isSuperAdmin, isSeller, sellerId]);

  const totalRevenue = visibleOrders
    .filter(
      (order) =>
        String(order.status || "").toLowerCase() !== "cancelled"
    )
    .reduce(
      (sum, order) =>
        sum + Number(order.total ?? order.totalAmount ?? 0),
      0
    );

  const pendingOrders = visibleOrders.filter(
    (order) =>
      !["delivered", "cancelled"].includes(
        String(order.status || "").toLowerCase()
      )
  ).length;

  const lowStockProducts = visibleProducts.filter((product) => {
    const stock = getStock(product);
    return stock !== null && stock > 0 && stock <= 5;
  });

  const outOfStockProducts = visibleProducts.filter((product) => {
    const stock = getStock(product);
    return stock !== null && stock <= 0;
  });

  const alertProducts = [
    ...outOfStockProducts,
    ...lowStockProducts,
  ];

  const recentOrders = [...visibleOrders]
    .sort(
      (a, b) =>
        new Date(b.createdAt || b.date || 0) -
        new Date(a.createdAt || a.date || 0)
    )
    .slice(0, 5);

  const handleLogout = () => {
    localStorage.removeItem("zovia-admin-session");
    navigate("/admin/login");
  };

  if (!session || (!isSuperAdmin && !isSeller)) {
    return (
      <main className="zadmin-access">
        <div className="zadmin-access-card">
          <span className="zadmin-brand">ZOVIA</span>
          <h1>Access required</h1>
          <p>Please log in with your admin or seller account.</p>
          <Link to="/admin/login" className="zadmin-primary-btn">
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="zadmin-layout">
      <aside className="zadmin-sidebar">
        <Link to="/admin" className="zadmin-brand">
          ZOVIA<span>.</span>
        </Link>

        <p className="zadmin-sidebar-caption">WORKSPACE</p>

        <nav className="zadmin-nav">
          <Link to="/admin" className="zadmin-nav-link active">
            <span>▦</span> Dashboard
          </Link>

          <Link to="/admin/products" className="zadmin-nav-link">
            <span>◇</span> Products
          </Link>

          <Link to="/admin/inventory" className="zadmin-nav-link">
            <span>▤</span> Inventory
          </Link>

          <Link to="/admin/orders" className="zadmin-nav-link">
            <span>⇄</span> Orders & Dispatch
          </Link>

          {isSuperAdmin && (
            <Link to="/admin/sellers" className="zadmin-nav-link">
              <span>♧</span> Sellers
            </Link>
          )}
        </nav>

        <div className="zadmin-sidebar-bottom">
          <div className="zadmin-account">
            <div className="zadmin-avatar">
              {isSuperAdmin ? "A" : "S"}
            </div>
            <div>
              <strong>
                {isSuperAdmin
                  ? "Super Admin"
                  : session.shopName || session.name || "Seller"}
              </strong>
              <small>
                {isSuperAdmin
                  ? "Full access"
                  : sellerId || "Seller account"}
              </small>
            </div>
          </div>

          <button
            type="button"
            className="zadmin-logout"
            onClick={handleLogout}
          >
            ↪ Log out
          </button>
        </div>
      </aside>

      <main className="zadmin-main">
        <header className="zadmin-header">
          <div>
            <p className="zadmin-eyebrow">ZOVIA MANAGEMENT</p>
            <h1>Dashboard</h1>
            <p className="zadmin-subtitle">
              Welcome back! Here's your store's latest overview.
            </p>
          </div>

          <span className="zadmin-role-badge">
            {isSuperAdmin ? "SUPER ADMIN" : "SELLER"}
          </span>
        </header>

        <section className="zadmin-stat-grid">
          <article className="zadmin-stat-card">
            <div className="zadmin-stat-top">
              <span>Total Products</span>
              <span className="zadmin-stat-icon lavender">◇</span>
            </div>
            <strong>{visibleProducts.length}</strong>
            <small>Products in your catalogue</small>
          </article>

          <article className="zadmin-stat-card">
            <div className="zadmin-stat-top">
              <span>Total Orders</span>
              <span className="zadmin-stat-icon peach">▤</span>
            </div>
            <strong>{visibleOrders.length}</strong>
            <small>Orders received</small>
          </article>

          <article className="zadmin-stat-card">
            <div className="zadmin-stat-top">
              <span>Pending Orders</span>
              <span className="zadmin-stat-icon yellow">◷</span>
            </div>
            <strong>{pendingOrders}</strong>
            <small>Orders yet to be completed</small>
          </article>

          <article className="zadmin-stat-card">
            <div className="zadmin-stat-top">
              <span>Order Value</span>
              <span className="zadmin-stat-icon green">₹</span>
            </div>
            <strong>
              ₹{totalRevenue.toLocaleString("en-IN")}
            </strong>
            <small>Value excluding cancelled orders</small>
          </article>
        </section>

        <section className="zadmin-content-grid">
          <div className="zadmin-panel">
            <div className="zadmin-panel-heading">
              <div>
                <p className="zadmin-eyebrow">STORE ACTIVITY</p>
                <h2>Recent Orders</h2>
              </div>
              <Link to="/admin/orders" className="zadmin-text-link">
                Manage orders →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="zadmin-empty">
                <span>▤</span>
                <h3>No orders yet</h3>
                <p>
                  New orders will appear here when customers place them.
                </p>
              </div>
            ) : (
              <div className="zadmin-order-list">
                {recentOrders.map((order, index) => (
                  <article
                    className="zadmin-order-row"
                    key={order.id || order._id || index}
                  >
                    <div className="zadmin-order-symbol">Z</div>

                    <div className="zadmin-order-info">
                      <strong>
                        {order.id || order._id || "Order"}
                      </strong>
                      <small>
                        {order.items?.length || 0} item(s)
                        {" · "}
                        {order.date || order.createdAt
                          ? new Date(
                              order.createdAt || order.date
                            ).toLocaleDateString("en-IN")
                          : "Date unavailable"}
                      </small>
                    </div>

                    <div className="zadmin-order-right">
                      <strong>
                        ₹{Number(order.total || 0).toLocaleString("en-IN")}
                      </strong>
                      <span
                        className={`zadmin-status ${String(
                          order.status || "Pending"
                        )
                          .toLowerCase()
                          .replaceAll(" ", "-")}`}
                      >
                        {order.status || "Pending"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="zadmin-panel zadmin-stock-panel">
            <div className="zadmin-panel-heading">
              <div>
                <p className="zadmin-eyebrow">STOCK HEALTH</p>
                <h2>Inventory Alerts</h2>
              </div>

              <span className="zadmin-alert-count">
                {alertProducts.length}
              </span>
            </div>

            {alertProducts.length === 0 ? (
              <div className="zadmin-stock-good">
                <span>✓</span>
                <div>
                  <strong>All looking good</strong>
                  <p>No low-stock or out-of-stock products found.</p>
                </div>
              </div>
            ) : (
              <div className="zadmin-low-stock-list">
                {alertProducts.slice(0, 8).map((product, index) => {
                  const stock = getStock(product);
                  const image =
                    product.image ||
                    product.imageUrl ||
                    product.images?.[0];

                  const isOutOfStock = stock !== null && stock <= 0;

                  return (
                    <div
                      className="zadmin-low-stock-row"
                      key={product._inventoryKey || product.id || product._id || index}
                    >
                      <div className="zadmin-product-placeholder">
                        {image ? (
                          <img
                            src={image}
                            alt={product._displayName || product.name || "Product"}
                          />
                        ) : (
                          <span>◇</span>
                        )}
                      </div>

                      <div className="zadmin-low-stock-info">
                        <strong>
                          {product._displayName ||
                            product.name ||
                            product.title ||
                            "Unnamed product"}
                        </strong>
                        <small>
                          {isOutOfStock
                            ? "Out of stock — restock required"
                            : `${stock} unit(s) remaining`}
                        </small>
                      </div>

                      <span
                        className={`zadmin-stock-number ${
                          isOutOfStock ? "danger" : ""
                        }`}
                      >
                        {stock ?? "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <Link to="/admin/inventory" className="zadmin-secondary-btn">
              Manage Inventory →
            </Link>
          </div>
        </section>

        <section className="zadmin-quick-actions">
          <div>
            <p className="zadmin-eyebrow">QUICK ACCESS</p>
            <h2>What would you like to manage?</h2>
          </div>

          <div className="zadmin-action-grid">
            <Link to="/admin/products" className="zadmin-action-card">
              <span className="zadmin-action-icon lavender">◇</span>
              <div>
                <strong>Products</strong>
                <small>View and manage products</small>
              </div>
              <span className="zadmin-action-arrow">↗</span>
            </Link>

            <Link to="/admin/inventory" className="zadmin-action-card">
              <span className="zadmin-action-icon green">▤</span>
              <div>
                <strong>Inventory</strong>
                <small>Check available stock</small>
              </div>
              <span className="zadmin-action-arrow">↗</span>
            </Link>

            <Link to="/admin/orders" className="zadmin-action-card">
              <span className="zadmin-action-icon peach">⇄</span>
              <div>
                <strong>Orders & Dispatch</strong>
                <small>Manage delivery progress</small>
              </div>
              <span className="zadmin-action-arrow">↗</span>
            </Link>

            {isSuperAdmin && (
              <Link to="/admin/sellers" className="zadmin-action-card">
                <span className="zadmin-action-icon yellow">♧</span>
                <div>
                  <strong>Sellers</strong>
                  <small>View registered sellers</small>
                </div>
                <span className="zadmin-action-arrow">↗</span>
              </Link>
            )}
          </div>
        </section>

        <footer className="zadmin-footer">
          <span>ZOVIA</span> · Store Management
        </footer>
      </main>
    </div>
  );
}

export default AdminDashboard;
