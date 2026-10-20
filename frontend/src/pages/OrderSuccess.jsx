import { Link, useLocation, useParams } from "react-router-dom";
import "./OrderSuccess.css";

function OrderSuccess() {
  const { orderId } = useParams();
  const location = useLocation();

  const order = location.state?.order;

  const orderTotal = Number(order?.total ?? 0);

  return (
    <div className="success-page">
      <div className="success-card">

        <div className="success-icon">
          ✓
        </div>

        <div className="success-eyebrow">
          ZOVIA ORDER CONFIRMED
        </div>

        <h1>Thank You!</h1>

        <p className="success-message">
          Your order has been successfully placed.
          <br />
          We are getting your beautiful pieces ready.
        </p>

        <div className="success-summary">

          <div className="summary-heading">
            <span>ORDER ID</span>

            <strong>
              #{orderId}
            </strong>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-total-row">

            <span className="total-label">
              Total
            </span>

            <strong className="total-amount">
              ₹{orderTotal.toLocaleString("en-IN")}
            </strong>

          </div>

        </div>

        <div className="success-actions">

          <Link
            to={`/track-order/${orderId}`}
            className="success-primary-btn"
          >
            Track My Order
            <span>→</span>
          </Link>

          <Link
            to="/shop"
            className="success-secondary-btn"
          >
            Continue Shopping
          </Link>

        </div>

        <div className="success-note">
          <span>✦</span>
          Thank you for choosing ZOVIA
        </div>

      </div>
    </div>
  );
}

export default OrderSuccess;