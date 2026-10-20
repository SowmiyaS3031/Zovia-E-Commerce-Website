
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useOrders } from "../context/OrderContext";
import "./Checkout.css";

const formatPrice = (amount) =>
  Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const readAppliedCoupon = () => {
  try {
    const saved = JSON.parse(
      localStorage.getItem("zovia-applied-coupon") || "null"
    );

    if (!saved) return null;

    return {
      ...saved,
      ...(saved.coupon && typeof saved.coupon === "object"
        ? saved.coupon
        : {}),
    };
  } catch {
    return null;
  }
};

function calculateCoupon(subtotal, coupon) {
  if (!coupon) {
    return { discount: 0, code: "", message: "" };
  }

  const code = String(
    coupon.code || coupon.couponCode || ""
  ).trim().toUpperCase();

  const now = new Date();
  const startDate = coupon.startDate
    ? new Date(coupon.startDate)
    : null;
  const expiryDate =
    coupon.expiryDate || coupon.endDate
      ? new Date(coupon.expiryDate || coupon.endDate)
      : null;

  const isActive =
    coupon.active !== false && coupon.isActive !== false;

  if (
    !code ||
    !isActive ||
    (startDate &&
      !Number.isNaN(startDate.getTime()) &&
      now < startDate) ||
    (expiryDate &&
      !Number.isNaN(expiryDate.getTime()) &&
      now > expiryDate)
  ) {
    return {
      discount: 0,
      code: "",
      message: "This coupon is no longer valid.",
    };
  }

  const minimumOrder = Number(
    coupon.minOrder ?? coupon.minimumOrder ?? 0
  );

  if (subtotal < minimumOrder) {
    return {
      discount: 0,
      code: "",
      message: `Minimum order value for ${code} is ₹${formatPrice(minimumOrder)}.`,
    };
  }

  const type = String(
    coupon.type || coupon.discountType || ""
  ).toLowerCase();

  const value = Number(
    coupon.value ??
      coupon.discountValue ??
      coupon.discountPercentage ??
      0
  );

  let discount = 0;

  if (["percentage", "percent", "%"].includes(type)) {
    discount = Math.round((subtotal * value) / 100);

    const maxDiscount = Number(
      coupon.maxDiscount ?? coupon.maximumDiscount ?? Infinity
    );

    if (Number.isFinite(maxDiscount) && maxDiscount >= 0) {
      discount = Math.min(discount, maxDiscount);
    }
  } else if (["fixed", "flat", "amount"].includes(type)) {
    discount = Math.round(value);
  } else {
    discount = Math.round(
      Number(coupon.discount ?? coupon.discountAmount ?? 0)
    );
  }

  discount = Math.min(subtotal, Math.max(0, discount));

  return {
    discount,
    code: discount > 0 ? code : "",
    message:
      discount > 0
        ? `Coupon ${code} applied successfully.`
        : "No discount is available for this coupon.",
  };
}

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { cartItems, removeFromCart } = useCart();
  const { placeOrder } = useOrders();

  // Buy Now product takes priority over cart products.
  const buyNowProduct = location.state?.buyNowProduct || null;

  const checkoutItems = buyNowProduct
    ? [
        {
          ...buyNowProduct,
          id:
            buyNowProduct.id ||
            buyNowProduct._id ||
            buyNowProduct.productId,
          quantity: Math.max(
            1,
            Number(buyNowProduct.quantity || 1)
          ),
        },
      ]
    : cartItems;

  const subtotal = checkoutItems.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState(
    "Cash on Delivery"
  );

  const [coupon] = useState(() => readAppliedCoupon());

  const couponResult = calculateCoupon(subtotal, coupon);
  const discount = couponResult.discount;
  const finalTotal = Math.max(0, subtotal - discount);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async(event) => {
    event.preventDefault();

    // Validate the items being checked out, not the cart itself.
    if (!checkoutItems || checkoutItems.length === 0) {
      alert("No products to order. Please select a product first.");
      navigate("/shop");
      return;
    }

    const requiredFields = Object.values(formData);

    if (requiredFields.some((value) => !String(value).trim())) {
      alert("Please fill all delivery details.");
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.phone.trim())) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!/^[0-9]{6}$/.test(formData.pincode.trim())) {
      alert("Please enter a valid 6-digit pincode.");
      return;
    }

    let order;

    try {
      order = await placeOrder({
        items: checkoutItems,
        subtotal,
        discount,
        couponCode: couponResult.code,
        total: finalTotal,
        address: formData,
        paymentMethod,
      });
    }  catch (error) {
  console.error("Order placement failed:", error);

  alert(
    error?.message ||
      "Unable to place your order. Check the backend terminal."
  );

  return;
}

    if (!order) {
      alert(
        "Order could not be created. If this error continues, check OrderContext.jsx."
      );
      return;
    }

    // A Buy Now order must not depend on cart contents.
    if (!buyNowProduct) {
      checkoutItems.forEach((item) => {
        const itemId = item.id || item._id || item.productId;
        if (itemId) removeFromCart(itemId);
      });
    }

    localStorage.removeItem("zovia-applied-coupon");

    navigate(`/order-success/${order.id || order._id}`, {
      state: { order },
    });
  };

  if (!checkoutItems || checkoutItems.length === 0) {
    return (
      <div className="checkout-empty-page">
        <nav className="checkout-navbar">
          <Link to="/home" className="checkout-logo">
            ZOVIA
          </Link>

          <div className="checkout-nav-links">
            <Link to="/home">Home</Link>
            <Link to="/shop">Shop</Link>
            <Link to="/wishlist">Wishlist</Link>
            <Link to="/cart">Cart</Link>
          </div>
        </nav>

        <div className="checkout-empty">
          <span>YOUR CART IS EMPTY</span>
          <h1>No items to checkout</h1>
          <p>
            Add something beautiful to your shopping bag
            and come back here.
          </p>
          <Link to="/shop" className="checkout-empty-button">
            Continue Shopping →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <nav className="checkout-navbar">
        <Link to="/home" className="checkout-logo">
          ZOVIA
        </Link>

        <div className="checkout-nav-links">
          <Link to="/home">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/cart">Cart</Link>
        </div>

        <div className="checkout-secure-badge">
          🔒 Secure Checkout
        </div>
      </nav>

      <header className="checkout-page-header">
        <div className="checkout-eyebrow">CHECKOUT</div>
        <h1>Complete Your Order</h1>

        <div className="checkout-steps">
          <span className="active">
            <b>01</b> Cart
          </span>
          <span className="active">
            <b>02</b> Checkout
          </span>
          <span>
            <b>03</b> Confirmation
          </span>
        </div>
      </header>

      <main className="checkout-layout">
        <section className="checkout-form-card">
          <div className="checkout-section-heading">
            <div className="checkout-number">01</div>
            <div>
              <span>DELIVERY</span>
              <h2>Shipping Address</h2>
            </div>
          </div>

          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="checkout-grid-two">
              <div className="checkout-field">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit phone number"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div className="checkout-field">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="House number, street, area"
                required
              />
            </div>

            <div className="checkout-grid-two">
              <div className="checkout-field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  required
                />
              </div>

              <div className="checkout-field">
                <label htmlFor="state">State</label>
                <input
                  id="state"
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  required
                />
              </div>
            </div>

            <div className="checkout-field checkout-pincode">
              <label htmlFor="pincode">Pincode</label>
              <input
                id="pincode"
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="6-digit pincode"
                maxLength={6}
                required
              />
            </div>

            <div className="payment-section">
              <div className="checkout-section-heading payment-heading">
                <div className="checkout-number">02</div>
                <div>
                  <span>PAYMENT</span>
                  <h2>Payment Method</h2>
                </div>
              </div>

              <div className="payment-options">
                <label
                  className={`payment-card ${
                    paymentMethod === "Cash on Delivery" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "Cash on Delivery"}
                    onChange={() => setPaymentMethod("Cash on Delivery")}
                  />
                  <div className="payment-icon">💵</div>
                  <strong>Cash on Delivery</strong>
                  <small>Pay when your order arrives</small>
                </label>

                <label
                  className={`payment-card ${
                    paymentMethod === "UPI" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "UPI"}
                    onChange={() => setPaymentMethod("UPI")}
                  />
                  <div className="payment-icon">📱</div>
                  <strong>UPI</strong>
                  <small>Google Pay · PhonePe · Paytm</small>
                </label>

                <label
                  className={`payment-card ${
                    paymentMethod === "Credit / Debit Card" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "Credit / Debit Card"}
                    onChange={() =>
                      setPaymentMethod("Credit / Debit Card")
                    }
                  />
                  <div className="payment-icon">💳</div>
                  <strong>Credit / Debit Card</strong>
                  <small>Secure card payment</small>
                </label>
              </div>
            </div>

            <button type="submit" className="place-order-button">
              <span>PLACE ORDER · ₹{formatPrice(finalTotal)}</span>
              <strong>→</strong>
            </button>
          </form>
        </section>

        <aside className="order-summary">
          <div className="summary-top-label">YOUR ORDER</div>
          <h2>Order Summary</h2>

          <div className="summary-products">
            {checkoutItems.map((item, index) => (
              <div
                className="summary-product"
                key={item.id || item._id || index}
              >
                <img
                  src={item.image || item.imageUrl || ""}
                  alt={item.name || item.title || "Product"}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src =
                      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80";
                  }}
                />

                <div className="summary-product-info">
                  <h3>{item.name || item.title || "Product"}</h3>
                  <span>Qty: {item.quantity || 1}</span>
                </div>

                <strong className="summary-product-price">
                  ₹
                  {formatPrice(
                    Number(item.price || 0) *
                      Number(item.quantity || 1)
                  )}
                </strong>
              </div>
            ))}
          </div>

          <div className="summary-details">
            <div>
              <span>Subtotal</span>
              <strong>₹{formatPrice(subtotal)}</strong>
            </div>

            {discount > 0 && (
              <div>
                <span>
                  Coupon Discount
                  {couponResult.code ? ` (${couponResult.code})` : ""}
                </span>
                <strong className="free">
                  −₹{formatPrice(discount)}
                </strong>
              </div>
            )}

            <div>
              <span>Shipping</span>
              <strong className="free">FREE</strong>
            </div>
          </div>

          {couponResult.message && (
            <p
              style={{
                color: discount > 0 ? "#477957" : "#876b55",
                fontSize: "13px",
                margin: "12px 0",
              }}
            >
              {couponResult.message}
            </p>
          )}

          <div className="summary-total">
            <span>Total</span>
            <strong>₹{formatPrice(finalTotal)}</strong>
          </div>

          <div className="secure-checkout-note">
            🔒 Secure ZOVIA checkout
          </div>
        </aside>
      </main>
    </div>
  );
}

export default Checkout;
