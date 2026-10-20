
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./Cart.css";

const COUPON_STORAGE_KEY = "zovia-coupons";

const readCoupons = () => {
  try {
    const saved = localStorage.getItem(COUPON_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isCouponAvailable = (coupon) => {
  const today = getToday();

  return (
    coupon.active === true &&
    (!coupon.startDate || coupon.startDate <= today) &&
    (!coupon.expiryDate || coupon.expiryDate >= today)
  );
};

const calculateDiscount = (coupon, subtotal) => {
  if (!coupon || subtotal <= 0) return 0;

  const value = Number(coupon.value) || 0;

  if (coupon.type === "percentage") {
    let discount = (subtotal * value) / 100;

    if (
      coupon.maxDiscount !== null &&
      coupon.maxDiscount !== undefined &&
      coupon.maxDiscount !== ""
    ) {
      discount = Math.min(
        discount,
        Math.max(0, Number(coupon.maxDiscount) || 0)
      );
    }

    return Math.min(subtotal, Math.max(0, discount));
  }

  if (coupon.type === "fixed") {
    return Math.min(subtotal, Math.max(0, value));
  }

  return 0;
};

const formatPrice = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

function Cart() {
  const navigate = useNavigate();

  const {
    cartItems,
    cartTotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
  } = useCart();

  const [coupons, setCoupons] = useState([]);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponMessageType, setCouponMessageType] = useState("");
  const [showAllOffers, setShowAllOffers] = useState(false);

  useEffect(() => {
    setCoupons(readCoupons());
  }, []);

  const subtotal = Number(cartTotal) || 0;

  const availableCoupons = useMemo(
    () => coupons.filter(isCouponAvailable),
    [coupons]
  );

  const appliedCoupon = useMemo(
    () =>
      availableCoupons.find(
        (coupon) =>
          String(coupon.code || "").trim().toUpperCase() ===
          appliedCode
      ) || null,
    [availableCoupons, appliedCode]
  );

  const couponError = useMemo(() => {
    if (!appliedCode) return "";

    if (!appliedCoupon) {
      return "This coupon is no longer active or has expired.";
    }

    const minimum = Number(appliedCoupon.minOrder) || 0;

    if (subtotal < minimum) {
      return `Add ${formatPrice(minimum - subtotal)} more to use this coupon.`;
    }

    return "";
  }, [appliedCode, appliedCoupon, subtotal]);

  const discount = couponError
    ? 0
    : calculateDiscount(appliedCoupon, subtotal);

  const finalTotal = Math.max(0, subtotal - discount);

  const applyCoupon = (codeToApply = couponInput) => {
    const code = String(codeToApply || "").trim().toUpperCase();

    if (!code) {
      setCouponMessage("Please enter a coupon code.");
      setCouponMessageType("error");
      return;
    }

    const coupon = coupons.find(
      (item) =>
        String(item.code || "").trim().toUpperCase() === code
    );

    if (!coupon) {
      setCouponMessage("Invalid coupon code. Please check and try again.");
      setCouponMessageType("error");
      return;
    }

    if (!isCouponAvailable(coupon)) {
      setCouponMessage("This coupon is inactive, not started, or expired.");
      setCouponMessageType("error");
      return;
    }

    const minimum = Number(coupon.minOrder) || 0;

    if (subtotal < minimum) {
      setCouponMessage(
        `Minimum order is ${formatPrice(minimum)}. Add ${formatPrice(
          minimum - subtotal
        )} more to apply this coupon.`
      );
      setCouponMessageType("error");
      return;
    }

    const amount = calculateDiscount(coupon, subtotal);

    if (amount <= 0) {
      setCouponMessage("This coupon does not provide a valid discount.");
      setCouponMessageType("error");
      return;
    }

    setAppliedCode(code);
    setCouponInput(code);
    setCouponMessage(
      `${code} applied successfully! You saved ${formatPrice(amount)}.`
    );
    setCouponMessageType("success");
  };

  const removeCoupon = () => {
    setAppliedCode("");
    setCouponInput("");
    setCouponMessage("Coupon removed.");
    setCouponMessageType("success");
  };

 

const handleCheckout = () => {
  if (cartItems.length === 0) {
    alert("Your cart is empty.");
    navigate("/shop");
    return;
  }

  if (appliedCode && couponError) {
    setCouponMessage(couponError);
    setCouponMessageType("error");
    return;
  }

  try {
    if (appliedCoupon && discount > 0) {
      localStorage.setItem(
        "zovia-applied-coupon",
        JSON.stringify({
          code: appliedCoupon.code,
          type: appliedCoupon.type,
          value: Number(appliedCoupon.value) || 0,
          minOrder: Number(appliedCoupon.minOrder) || 0,
          maxDiscount: appliedCoupon.maxDiscount ?? null,
          startDate: appliedCoupon.startDate || "",
          expiryDate: appliedCoupon.expiryDate || "",
          active: appliedCoupon.active,
          discount,
          subtotal,
          finalTotal,
        })
      );
    } else {
      localStorage.removeItem("zovia-applied-coupon");
    }
  } catch (error) {
    console.error("Unable to save coupon:", error);
  }

  navigate("/checkout");
};


  const visibleOffers = showAllOffers
    ? availableCoupons
    : availableCoupons.slice(0, 3);

  return (
    <div className="cart-page">
      <nav className="cart-navbar">
        <div
          className="cart-logo"
          onClick={() => navigate("/home")}
        >
          ZOVIA
        </div>

        <div className="cart-nav-links">
          <span onClick={() => navigate("/home")}>Home</span>
          <span onClick={() => navigate("/shop")}>Shop</span>
          <span onClick={() => navigate("/wishlist")}>Wishlist</span>
          <span className="active">Cart</span>
        </div>

        <div className="cart-nav-actions">
          <button onClick={() => navigate("/shop")} aria-label="Search products">
            ⌕
          </button>
          <button onClick={() => navigate("/wishlist")} aria-label="Wishlist">
            ♡
          </button>
          <button className="active-cart" aria-label="Shopping cart">
            🛒
          </button>
        </div>
      </nav>

      <section className="cart-header">
        <div className="cart-header-content">
          <p className="cart-eyebrow">YOUR ZOVIA BAG</p>
          <h1>
            Shopping <span>Bag</span>
          </h1>
          <p>
            Review your selected pieces before making them yours.
          </p>
        </div>

        <div className="cart-header-decoration">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </section>

      {cartItems.length === 0 ? (
        <section className="cart-empty">
          <div className="empty-cart-icon">🛍</div>
          <p className="empty-small">YOUR BAG IS WAITING</p>
          <h2>Your cart is empty</h2>
          <p>
            Discover something beautiful and add it to your collection.
          </p>
          <button onClick={() => navigate("/shop")}>
            Explore Collection <span>→</span>
          </button>
        </section>
      ) : (
        <main className="cart-content">
          <section className="cart-items-section">
            <div className="cart-section-heading">
              <div>
                <p>YOUR SELECTION</p>
                <h2>Cart Items</h2>
              </div>
              <span>
                {cartItems.length}{" "}
                {cartItems.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="cart-items">
              {cartItems.map((product) => (
                <article className="cart-item" key={product.id}>
                  <div
                    className="cart-item-image"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=85";
                      }}
                    />
                    <span>ZOVIA</span>
                  </div>

                  <div className="cart-item-info">
                    <p className="cart-item-category">
                      {product.category}
                    </p>

                    <h3
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {product.name}
                    </h3>

                    <div className="cart-rating">
                      <span>★</span> {product.rating}
                    </div>

                    <div className="cart-item-bottom">
                      <div className="quantity-box">
                        <button
                          onClick={() => decreaseQuantity(product.id)}
                          aria-label={`Decrease ${product.name} quantity`}
                        >
                          −
                        </button>

                        <span>{product.quantity}</span>

                        <button
                          onClick={() => increaseQuantity(product.id)}
                          aria-label={`Increase ${product.name} quantity`}
                        >
                          +
                        </button>
                      </div>

                      <strong>
                        {formatPrice(
                          Number(product.price) *
                            Number(product.quantity)
                        )}
                      </strong>
                    </div>

<div className="cart-item-actions">
  <button
    type="button"
    className="remove-item"
    onClick={() => removeFromCart(product.id)}
  >
    Remove item
  </button>
</div>

<button
  type="button"
  className="cart-buy-now-button"
  onClick={() => {
    navigate("/checkout", {
      state: {
        buyNowProduct: {
          ...product,
          quantity: Number(product.quantity) || 1,
        },
      },
    });
  }}
>
  <span>Buy Now</span>
  <span className="buy-now-arrow" aria-hidden="true">→</span>
</button>



                  </div>
                </article>
              ))}
            </div>

            <button
              className="continue-shopping"
              onClick={() => navigate("/shop")}
            >
              ← Continue Shopping
            </button>
          </section>

          <aside className="order-summary">
            <div className="summary-top">
              <p>ORDER SUMMARY</p>
              <h2>Your Order</h2>
            </div>

            <div className="summary-line">
              <span>Products</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>

            <div className="summary-line">
              <span>Shipping</span>
              <strong className="free">FREE</strong>
            </div>

            <div className="summary-line">
              <span>Delivery</span>
              <span>3–5 Business Days</span>
            </div>

            <div className="summary-divider"></div>

            {/* COUPON SECTION */}
            <section className="cart-coupon-section">
              <div className="coupon-heading">
                <div className="coupon-heading-icon">%</div>
                <div>
                  <h3>Offers & Coupons</h3>
                  <p>Make your order a little sweeter.</p>
                </div>
              </div>

              {availableCoupons.length > 0 ? (
                <div className="available-offers">
                  <p className="available-offers-title">
                    AVAILABLE OFFERS
                  </p>

                  {visibleOffers.map((coupon) => (
                    <div className="available-offer" key={coupon.id || coupon.code}>
                      <div className="offer-code">
                        {coupon.code}
                      </div>

                      <div className="offer-details">
                        <strong>
                          {coupon.type === "percentage"
                            ? `${coupon.value}% OFF`
                            : `${formatPrice(coupon.value)} OFF`}
                        </strong>

                        <span>
                          {Number(coupon.minOrder) > 0
                            ? `Min. order ${formatPrice(coupon.minOrder)}`
                            : "No minimum order"}
                          {coupon.type === "percentage" &&
                          coupon.maxDiscount !== null &&
                          coupon.maxDiscount !== undefined &&
                          coupon.maxDiscount !== ""
                            ? ` · Max ${formatPrice(coupon.maxDiscount)} off`
                            : ""}
                        </span>

                        {coupon.expiryDate && (
                          <span>
                            Valid until {coupon.expiryDate}
                          </span>
                        )}
                      </div>

                      <button
                        className="offer-apply-button"
                        onClick={() => applyCoupon(coupon.code)}
                        disabled={
                          appliedCode ===
                            String(coupon.code || "").trim().toUpperCase() &&
                          !couponError
                        }
                      >
                        {appliedCode ===
                        String(coupon.code || "").trim().toUpperCase()
                          ? "Applied"
                          : "Apply"}
                      </button>
                    </div>
                  ))}

                  {availableCoupons.length > 3 && (
                    <button
                      className="show-offers-button"
                      onClick={() => setShowAllOffers((value) => !value)}
                    >
                      {showAllOffers ? "Show less" : "View all offers"}
                    </button>
                  )}
                </div>
              ) : (
                <p className="no-offers">
                  No active offers right now. Check back soon!
                </p>
              )}

              <div className="coupon-input-row">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(event) => {
                    setCouponInput(event.target.value.toUpperCase());
                    setCouponMessage("");
                    setCouponMessageType("");
                  }}
                  placeholder="Enter coupon code"
                  aria-label="Coupon code"
                  disabled={Boolean(appliedCode && !couponError)}
                />

                {appliedCode && !couponError ? (
                  <button
                    className="coupon-remove-button"
                    onClick={removeCoupon}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    className="coupon-apply-button"
                    onClick={() => applyCoupon()}
                  >
                    Apply
                  </button>
                )}
              </div>

              {couponMessage && (
                <p
                  className={`coupon-message ${couponMessageType}`}
                  role="status"
                >
                  {couponMessage}
                </p>
              )}

              {!couponMessage && couponError && (
                <p className="coupon-message error" role="status">
                  {couponError}
                </p>
              )}

              {appliedCoupon && !couponError && (
                <p className="coupon-message success" role="status">
                  {appliedCoupon.code} is applied to your order.
                </p>
              )}
            </section>

            <div className="summary-divider"></div>

            {discount > 0 && (
              <>
                <div className="summary-line coupon-discount-line">
                  <span>Coupon discount</span>
                  <strong>- {formatPrice(discount)}</strong>
                </div>

                <div className="summary-line">
                  <span>Coupon</span>
                  <strong className="applied-coupon-code">
                    {appliedCoupon?.code}
                  </strong>
                </div>

                <div className="summary-divider"></div>
              </>
            )}

            <div className="summary-total">
              <span>Total</span>
              <strong>{formatPrice(finalTotal)}</strong>
            </div>

            {discount > 0 && (
              <p className="cart-savings-note">
                You save {formatPrice(discount)} on this order!
              </p>
            )}

            <button
              className="checkout-button"
              onClick={handleCheckout}
            >
              Proceed to Checkout <span>→</span>
            </button>

            <div className="secure-note">
              <span>✦</span>
              <p>
                Secure checkout · Easy returns · Premium shopping
              </p>
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}

export default Cart;
