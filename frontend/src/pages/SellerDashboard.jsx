

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SellerDashboard.css";

const API_URL = "http://localhost:5000/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=300&q=80";

const TRACKING_STATUSES = [
  "Order Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Dispatched",
  "Out for Delivery",
  "Delivered",
];

const NEXT_STATUS = {
  "Order Placed": "Confirmed",
  Confirmed: "Packed",
  Packed: "Shipped",
  Shipped: "Dispatched",
  Dispatched: "Out for Delivery",
  "Out for Delivery": "Delivered",
};

const readStorage = (key, fallback = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const getProductId = (product) =>
  String(product?._id || product?.id || "");

const getOrderId = (order) =>
  String(order?._id || order?.id || order?.orderId || "");

const getOrderStatus = (order) =>
  String(order?.status || "Order Placed");

function SellerDashboard() {
  const navigate = useNavigate();

  const [session] = useState(() =>
    readStorage("zovia-admin-session")
  );

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [statusSelections, setStatusSelections] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  const sellerId = String(session?.sellerId || "");

  const token =
    session?.token ||
    session?.accessToken ||
    session?.access_token ||
    localStorage.getItem("token") ||
    localStorage.getItem("zovia-token") ||
    "";

  const loadProducts = useCallback(async () => {
    if (!session || session.role !== "seller" || !token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/products/mine`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to load inventory.");
      }

      const productList = Array.isArray(data)
        ? data
        : Array.isArray(data.products)
          ? data.products
          : Array.isArray(data.data)
            ? data.data
            : Array.isArray(data.data?.products)
              ? data.data.products
              : null;

      if (!productList) {
        throw new Error("Unexpected products API response format.");
      }

      setProducts(productList);
    } catch (err) {
      setError(
        err.message || "Unable to load products. Check the backend."
      );
    } finally {
      setLoading(false);
    }
  }, [session, token]);

  const loadOrders = useCallback(async () => {
    if (!session || session.role !== "seller" || !token) {
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);
    setOrdersError("");

    try {
      const response = await fetch(`${API_URL}/orders/seller/mine`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          data.message || "Seller session expired. Please log in again."
        );
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to load seller orders.");
      }

      const orderList = Array.isArray(data)
        ? data
        : Array.isArray(data.orders)
          ? data.orders
          : Array.isArray(data.data?.orders)
            ? data.data.orders
            : null;

      if (!orderList) {
        throw new Error("Unexpected orders API response format.");
      }

      setOrders(orderList);

      setStatusSelections((previous) => {
        const next = { ...previous };

        orderList.forEach((order) => {
          const id = getOrderId(order);
          const nextStatus = NEXT_STATUS[getOrderStatus(order)];

          if (!nextStatus || !id) {
            delete next[id];
          } else if (!next[id]) {
            next[id] = nextStatus;
          }
        });

        return next;
      });
    } catch (err) {
      setOrdersError(err.message || "Unable to load seller orders.");
    } finally {
      setOrdersLoading(false);
    }
  }, [session, token]);

  const loadLocalProfile = useCallback(() => {
    setProfile(readStorage("zovia-seller-profile", {}) || {});
  }, []);

  const refreshDashboard = useCallback(() => {
    loadLocalProfile();
    loadProducts();
    loadOrders();
  }, [loadLocalProfile, loadProducts, loadOrders]);

  useEffect(() => {
    if (!session || session.role !== "seller") {
      navigate("/admin/login", { replace: true });
      return;
    }

    if (!token) {
      setError("Login token missing. Please log in again.");
      setLoading(false);
      setOrdersLoading(false);
      return;
    }

    refreshDashboard();

    const refresh = () => {
      loadLocalProfile();
      loadProducts();
      loadOrders();
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("zovia-products-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("zovia-products-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [
    session,
    token,
    navigate,
    refreshDashboard,
    loadLocalProfile,
    loadProducts,
    loadOrders,
  ]);

  const updateOrderStatus = async (order) => {
    const orderId = getOrderId(order);
    const currentStatus = getOrderStatus(order);
    const nextStatus = statusSelections[orderId];

    if (!orderId || !nextStatus) {
      setOrdersError("Unable to identify this order or its next status.");
      return;
    }

    if (nextStatus !== NEXT_STATUS[currentStatus]) {
      setOrdersError(
        `Please update the order one stage at a time. Next stage: ${
          NEXT_STATUS[currentStatus] || "No further updates"
        }.`
      );
      return;
    }

    setUpdatingOrderId(orderId);
    setOrdersError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_URL}/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        throw new Error(data.message || "Please log in again.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to update order status.");
      }

      setSuccessMessage(
        `Order #${orderId} updated to "${nextStatus}".`
      );

      await loadOrders();
    } catch (err) {
      setOrdersError(
        err.message || "Unable to update order status. Try again."
      );
    } finally {
      setUpdatingOrderId("");
    }
  };

  const sellerOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      ),
    [orders]
  );

  const lowStockProducts = useMemo(
    () =>
      products.filter((product) => Number(product.stock ?? 0) <= 5),
    [products]
  );

  const totalSales = useMemo(
    () =>
      sellerOrders.reduce((sum, order) => {
        if (getOrderStatus(order) !== "Delivered") {
          return sum;
        }

        const items = Array.isArray(order.items) ? order.items : [];

        const sellerTotal = items.reduce(
          (itemSum, item) =>
            itemSum +
            Number(item.price || 0) * Number(item.quantity || 1),
          0
        );

        return sum + sellerTotal;
      }, 0),
    [sellerOrders]
  );

  const shopName =
    profile.shopName || session?.shopName || session?.name || "My ZOVIA Shop";

  const ownerName =
    profile.ownerName || session?.ownerName || session?.name || "Seller";

  const recentOrders = sellerOrders.slice(0, 5);

  const handleLogout = () => {
    localStorage.removeItem("zovia-admin-session");
    navigate("/admin/login", { replace: true });
  };

  if (!session || session.role !== "seller") {
    return null;
  }

  return (
    <div className="seller-dashboard-layout">
      <aside className="seller-sidebar">
        <Link to="/seller/dashboard" className="seller-brand">
          ZOVIA<span>.</span>
          <small>SELLER STUDIO</small>
        </Link>

        <div className="seller-sidebar-label">WORKSPACE</div>

        <nav className="seller-nav">
          <Link
            to="/seller/dashboard"
            className="seller-nav-link active"
          >
            <span>▦</span> Dashboard
          </Link>

          <Link to="/seller/products" className="seller-nav-link">
            <span>▤</span> Inventory
          </Link>

          <a href="#orders" className="seller-nav-link">
            <span>▣</span> My Orders
          </a>

          <a href="#shop-profile" className="seller-nav-link">
            <span>♙</span> Shop Profile
          </a>
        </nav>

        <div className="seller-sidebar-bottom">
          <Link to="/shop" className="seller-store-link">
            ↗ View Store
          </Link>

          <button
            type="button"
            className="seller-logout-button"
            onClick={handleLogout}
          >
            ↪ Log Out
          </button>
        </div>
      </aside>

      <main className="seller-dashboard-main">
        <header className="seller-topbar">
          <div>
            <span className="seller-eyebrow">SELLER WORKSPACE</span>
            <h1>Dashboard</h1>
          </div>

          <div className="seller-topbar-profile">
            <div className="seller-avatar">
              {String(ownerName).charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{ownerName}</strong>
              <span>Seller Account</span>
            </div>
          </div>
        </header>

        <section className="seller-welcome-banner">
          <div>
            <span>YOUR SHOP AT A GLANCE</span>
            <h2>Welcome back, {ownerName}!</h2>
            <p>
              Manage your products, monitor orders and keep your shop
              running smoothly.
            </p>
          </div>

          <Link
            to="/seller/products/add"
            className="seller-primary-button"
          >
            + Add Product
          </Link>
        </section>

        {error && (
          <div className="seller-dashboard-error">
            <span>{error}</span>
            <button type="button" onClick={refreshDashboard}>
              Retry
            </button>
            {error.includes("log in again") && (
              <button type="button" onClick={handleLogout}>
                Log In
              </button>
            )}
          </div>
        )}

        {ordersError && (
          <div className="seller-dashboard-error">
            <span>{ordersError}</span>
            <button type="button" onClick={loadOrders}>
              Retry Orders
            </button>
          </div>
        )}

        {successMessage && (
          <div className="seller-dashboard-success">
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <section className="seller-stats-grid">
          <article className="seller-stat-card">
            <div className="seller-stat-heading">
              <span>Total Products</span>
              <span className="seller-stat-icon lavender">▤</span>
            </div>
            <strong>{loading ? "—" : products.length}</strong>
            <p>Products in your inventory</p>
          </article>

          <article className="seller-stat-card">
            <div className="seller-stat-heading">
              <span>Total Orders</span>
              <span className="seller-stat-icon peach">▣</span>
            </div>
            <strong>{ordersLoading ? "—" : sellerOrders.length}</strong>
            <p>Orders linked to your shop</p>
          </article>

          <article className="seller-stat-card">
            <div className="seller-stat-heading">
              <span>Delivered Sales</span>
              <span className="seller-stat-icon green">₹</span>
            </div>
            <strong>{formatPrice(totalSales)}</strong>
            <p>Based on delivered seller orders</p>
          </article>

          <article className="seller-stat-card">
            <div className="seller-stat-heading">
              <span>Low Stock</span>
              <span className="seller-stat-icon red">!</span>
            </div>
            <strong>{loading ? "—" : lowStockProducts.length}</strong>
            <p>Products with 5 or fewer items</p>
          </article>
        </section>

        <section className="seller-dashboard-content-grid">
          <div className="seller-panel seller-inventory-panel">
            <div className="seller-panel-heading">
              <div>
                <span className="seller-eyebrow">PRODUCT MANAGEMENT</span>
                <h2>Inventory Overview</h2>
              </div>
              <Link to="/seller/products">View All ↗</Link>
            </div>

            {loading ? (
              <div className="seller-empty-state">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="seller-empty-state">
                <span className="seller-empty-icon">▤</span>
                <h3>No products yet</h3>
                <p>Add your first product to start building your shop.</p>
                <Link
                  to="/seller/products/add"
                  className="seller-secondary-button"
                >
                  Add Your First Product
                </Link>
              </div>
            ) : (
              <div className="seller-product-list">
                {products.slice(0, 5).map((product) => (
                  <div
                    className="seller-product-row"
                    key={getProductId(product) || product.name}
                  >
                    <img
                      src={product.image || FALLBACK_IMAGE}
                      alt={product.name || product.title || "Product"}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />

                    <div className="seller-product-info">
                      <strong>{product.name || product.title}</strong>
                      <span>{product.category || "Uncategorized"}</span>
                    </div>

                    <div className="seller-product-stock">
                      <strong>{formatPrice(product.price)}</strong>
                      <span
                        className={
                          Number(product.stock || 0) <= 5
                            ? "stock-low"
                            : "stock-available"
                        }
                      >
                        {Number(product.stock || 0)} in stock
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="seller-panel seller-low-stock-panel">
            <div className="seller-panel-heading">
              <div>
                <span className="seller-eyebrow">STOCK MONITOR</span>
                <h2>Low Stock Alerts</h2>
              </div>
              <span className="seller-alert-count">
                {lowStockProducts.length}
              </span>
            </div>

            {loading ? (
              <div className="seller-empty-state">Checking stock...</div>
            ) : lowStockProducts.length === 0 ? (
              <div className="seller-empty-state">
                <span className="seller-empty-icon">✓</span>
                <h3>Stock looks good!</h3>
                <p>No products are at or below 5 items.</p>
              </div>
            ) : (
              <div className="seller-low-stock-list">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    className="seller-low-stock-item"
                    key={getProductId(product) || product.name}
                  >
                    <div>
                      <strong>{product.name || product.title}</strong>
                      <span>
                        {Number(product.stock || 0) === 0
                          ? "Out of stock"
                          : "Restock recommended"}
                      </span>
                    </div>
                    <strong className="stock-low">
                      {Number(product.stock || 0)}
                    </strong>
                  </div>
                ))}
                <Link
                  to="/seller/products"
                  className="seller-secondary-button seller-full-button"
                >
                  Manage Inventory
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="seller-panel seller-orders-panel" id="orders">
          <div className="seller-panel-heading">
            <div>
              <span className="seller-eyebrow">ORDER MANAGEMENT</span>
              <h2>Recent Orders</h2>
            </div>

            <button
              type="button"
              className="seller-secondary-button"
              onClick={loadOrders}
              disabled={ordersLoading}
            >
              {ordersLoading ? "Refreshing..." : "↻ Refresh Orders"}
            </button>
          </div>

          {ordersLoading ? (
            <div className="seller-empty-state">Loading orders...</div>
          ) : recentOrders.length === 0 ? (
            <div className="seller-empty-state">
              <span className="seller-empty-icon">▣</span>
              <h3>No orders to show</h3>
              <p>
                Orders containing your products will appear here after a
                customer places an order.
              </p>
            </div>
          ) : (
            <div className="seller-table-wrapper">
              <table className="seller-orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Your Items Total</th>
                    <th>Current Status</th>
                    <th>Update Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map((order) => {
                    const orderId = getOrderId(order);
                    const currentStatus = getOrderStatus(order);
                    const nextStatus = NEXT_STATUS[currentStatus];
                    const isUpdating = updatingOrderId === orderId;

                    const itemCount = (
                      Array.isArray(order.items) ? order.items : []
                    ).reduce(
                      (count, item) =>
                        count + Number(item.quantity || 1),
                      0
                    );

                    const sellerTotal =
                      order.sellerTotal ??
                      (Array.isArray(order.items)
                        ? order.items.reduce(
                            (sum, item) =>
                              sum +
                              Number(item.price || 0) *
                                Number(item.quantity || 1),
                            0
                          )
                        : 0);

                    return (
                      <tr key={orderId}>
                        <td>#{orderId || "N/A"}</td>

                        <td>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString(
                                "en-IN"
                              )
                            : "—"}
                        </td>

                        <td>{itemCount}</td>

                        <td>{formatPrice(sellerTotal)}</td>

                        <td>
                          <span className="seller-order-status">
                            {currentStatus}
                          </span>
                        </td>

                        <td>
                          {nextStatus ? (
                            <div className="seller-status-update">
                              <select
                                aria-label={`Next status for order ${orderId}`}
                                value={
                                  statusSelections[orderId] || nextStatus
                                }
                                onChange={(event) =>
                                  setStatusSelections((previous) => ({
                                    ...previous,
                                    [orderId]: event.target.value,
                                  }))
                                }
                                disabled={isUpdating}
                              >
                                <option value={nextStatus}>
                                  {nextStatus}
                                </option>
                              </select>

                              <button
                                type="button"
                                className="seller-status-update-button"
                                onClick={() => updateOrderStatus(order)}
                                disabled={isUpdating}
                              >
                                {isUpdating ? "Saving..." : "Update"}
                              </button>
                            </div>
                          ) : (
                            <span className="seller-order-status">
                              {currentStatus === "Delivered"
                                ? "Completed"
                                : currentStatus === "Cancelled"
                                  ? "Cancelled"
                                  : "No further updates"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="seller-data-note">
            Orders and status updates are saved through the backend.
          </p>
        </section>

        <section
          className="seller-panel seller-shop-profile"
          id="shop-profile"
        >
          <div className="seller-panel-heading">
            <div>
              <span className="seller-eyebrow">YOUR BUSINESS</span>
              <h2>Shop Profile</h2>
            </div>
          </div>

          <div className="seller-shop-profile-grid">
            <div>
              <span>Shop Name</span>
              <strong>{shopName}</strong>
            </div>

            <div>
              <span>Owner</span>
              <strong>{ownerName}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>
                {profile.email || session?.email || "Not available"}
              </strong>
            </div>

            <div>
              <span>Seller ID</span>
              <strong>{sellerId || "Not available"}</strong>
            </div>

            <div>
              <span>Category</span>
              <strong>
                {profile.businessCategory ||
                  session?.businessCategory ||
                  "Not available"}
              </strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>
                {profile.phone || session?.phone || "Not available"}
              </strong>
            </div>
          </div>
        </section>

        <footer className="seller-dashboard-footer">
          <span>© {new Date().getFullYear()} ZOVIA Seller Studio</span>
          <span>Style. Shop. Simplified.</span>
        </footer>
      </main>
    </div>
  );
}

export default SellerDashboard;
