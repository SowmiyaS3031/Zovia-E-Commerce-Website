
import { Link, useNavigate } from "react-router-dom";
import { useOrders } from "../context/OrderContext";
import products from "../data/products";
import "./Orders.css";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=500&q=80";

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

function getImage(product) {
  return (
    product?.image ||
    product?.imageUrl ||
    product?.thumbnail ||
    product?.img ||
    ""
  );
}

function getProductId(product) {
  const id = product?.productId ?? product?._id ?? product?.id;

  if (id && typeof id === "object") {
    return String(id._id ?? id.id ?? "");
  }

  return id == null ? "" : String(id);
}

function getOrderItemImage(item, allProducts) {
  const savedImage =
    item?.image ||
    item?.imageUrl ||
    item?.thumbnail ||
    item?.img;

  if (savedImage) return savedImage;

  const itemProductId = String(
    item?.productId ?? item?._id ?? item?.id ?? ""
  );

  const itemName = String(item?.name || item?.title || "")
    .trim()
    .toLowerCase();

  const match = allProducts.find((product) => {
    const productId = String(
      product?.productId ?? product?._id ?? product?.id ?? ""
    );

    const productName = String(
      product?.name || product?.title || ""
    )
      .trim()
      .toLowerCase();

    return (
      (itemProductId && productId === itemProductId) ||
      (itemName && productName === itemName)
    );
  });

  return (
    match?.image ||
    match?.imageUrl ||
    match?.thumbnail ||
    match?.img ||
    FALLBACK_IMAGE
  );
}
function Orders() {
  const { orders = [], cancelOrder } = useOrders();
  const navigate = useNavigate();

  const allProducts = [
    ...(Array.isArray(products) ? products : []),
    ...readSellerProducts(),
  ];

  return (
    <div className="orders-page">
      <nav className="orders-navbar">
        <Link to="/" className="orders-logo">
          ZOVIA
        </Link>

        <div className="orders-nav-links">
          <Link to="/home">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/orders" className="active">
            My Orders
          </Link>
          <Link to="/cart">Cart</Link>
        </div>
      </nav>

      <section className="orders-hero">
        <p className="orders-eyebrow">YOUR ZOVIA ACCOUNT</p>
        <h1>My Orders</h1>
        <p>Track and manage everything you've purchased.</p>
      </section>

      <main className="orders-container">
        {orders.length === 0 ? (
          <div className="orders-empty">
            <div className="empty-icon">♡</div>
            <h2>No orders yet</h2>
            <p>Your placed orders will appear here.</p>
            <Link to="/shop" className="shop-now-btn">
              Explore ZOVIA
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-header">
                  <div>
                    <span className="order-label">ORDER ID</span>
                    <h2>#{order.id}</h2>
                  </div>

                  <div className="order-date">
                    <strong>{order.date}</strong>
                    <span>{order.time}</span>
                  </div>
                </div>

                <div className="order-products">
                  {(order.items || []).map((item, index) => (
                    <div
                      className="order-product"
                      key={item.id || item.productId || index}
                    >
                      <div className="order-product-image">
                        <img
                          src={getOrderItemImage(item, allProducts)}
                          alt={item.name || "ZOVIA product"}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                      </div>

                      <div className="order-product-info">
                        <span className="product-category">
                          {item.category || "Product"}
                        </span>

                        <h3>{item.name || item.title || "ZOVIA Product"}</h3>

                        <p>
                          Qty: <strong>{item.quantity}</strong>
                        </p>

                        <span className="product-price">
                          ₹{Number(item.price || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <div className="order-status-block">
                    <span className="footer-label">ORDER STATUS</span>

                    <span
                      className={`status-badge ${
                        order.status?.toLowerCase().replaceAll(" ", "-") || ""
                      }`}
                    >
                      <span className="status-dot"></span>
                      {order.status || "Order Placed"}
                    </span>
                  </div>

                  <div className="order-total">
                    <span className="footer-label">TOTAL</span>
                    <strong>
                      ₹{Number(order.total || 0).toLocaleString("en-IN")}
                    </strong>
                  </div>

                  <div className="order-actions">
                    {order.status !== "Cancelled" && (
                      <button
                        type="button"
                        className="track-btn"
                        onClick={() =>
                          navigate(`/track-order/${order.id}`)
                        }
                      >
                        Track Order <span>→</span>
                      </button>
                    )}

                    {order.status === "Order Placed" && (
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={async () => {
                          const confirmed = window.confirm(
                            "Are you sure you want to cancel this order?"
                          );

                          if (confirmed) {
                            await cancelOrder(order.id);
                          }
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="orders-footer">
        <div>
          <strong>ZOVIA</strong>
          <span>Style. Shop. Simplified.</span>
        </div>
        <p>© 2026 ZOVIA. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Orders;