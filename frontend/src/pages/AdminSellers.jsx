
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AdminSellers.css";

function AdminSellers() {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [filter, setFilter] = useState("All");

  const session = JSON.parse(
    localStorage.getItem("zovia-admin-session") || "null"
  );

  useEffect(() => {
    if (session?.role !== "super-admin") return;

    const saved = JSON.parse(
      localStorage.getItem("zovia-sellers") || "[]"
    );

    setSellers(saved);
  }, []);

  if (session?.role !== "super-admin") {
    return (
      <div className="sellers-access">
        <h2>Admin access required</h2>
        <p>Please log in with your Super Admin account.</p>
        <Link to="/admin/login">Go to Login</Link>
      </div>
    );
  }

  const updateStatus = (sellerId, status) => {
    const updated = sellers.map((seller) =>
      seller.sellerId === sellerId
        ? { ...seller, status }
        : seller
    );

    localStorage.setItem("zovia-sellers", JSON.stringify(updated));
    setSellers(updated);
  };

  const filteredSellers =
    filter === "All"
      ? sellers
      : sellers.filter((seller) => seller.status === filter);

  return (
    <div className="admin-sellers-page">
      <header className="sellers-header">
        <div>
          <Link to="/admin" className="sellers-back">
            ← Back to Dashboard
          </Link>
          <span className="sellers-eyebrow">ZOVIA MANAGEMENT</span>
          <h1>Registered Sellers</h1>
          <p>View and manage shops registered on ZOVIA.</p>
        </div>

        <div className="sellers-count">
          <strong>{sellers.length}</strong>
          <span>Total Sellers</span>
        </div>
      </header>

      <div className="sellers-toolbar">
        <div>
          <h2>Seller Directory</h2>
          <p>{filteredSellers.length} seller(s) found</p>
        </div>

        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter sellers by status"
        >
          <option value="All">All Sellers</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {filteredSellers.length === 0 ? (
        <div className="sellers-empty">
          <span>♙</span>
          <h2>No sellers found</h2>
          <p>New seller registrations will appear here.</p>
          <Link to="/seller/register">Register a Seller</Link>
        </div>
      ) : (
        <div className="sellers-grid">
          {filteredSellers.map((seller) => (
            <article className="seller-card" key={seller.sellerId}>
              <div className="seller-card-top">
                <div className="seller-avatar">
                  {(seller.shopName || "S").charAt(0).toUpperCase()}
                </div>

                <span
                  className={`seller-status ${
                    (seller.status || "Pending").toLowerCase()
                  }`}
                >
                  {seller.status || "Pending"}
                </span>
              </div>

              <h3>{seller.shopName}</h3>
              <p className="seller-owner">Owned by {seller.ownerName}</p>

              <div className="seller-details">
                <p><strong>Seller ID</strong><span>{seller.sellerId}</span></p>
                <p><strong>Category</strong><span>{seller.businessCategory}</span></p>
                <p><strong>Email</strong><span>{seller.email}</span></p>
                <p><strong>Phone</strong><span>{seller.phone}</span></p>
                <p><strong>Address</strong><span>{seller.shopAddress}</span></p>
              </div>

              <div className="seller-card-actions">
                {seller.status !== "Active" && (
                  <button
                    className="seller-approve"
                    onClick={() => updateStatus(seller.sellerId, "Active")}
                  >
                    Approve Seller
                  </button>
                )}

                {seller.status !== "Rejected" && (
                  <button
                    className="seller-reject"
                    onClick={() => updateStatus(seller.sellerId, "Rejected")}
                  >
                    Reject
                  </button>
                )}

                {seller.status === "Rejected" && (
                  <button
                    className="seller-approve"
                    onClick={() => updateStatus(seller.sellerId, "Active")}
                  >
                    Reactivate
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <button
        className="sellers-logout"
        onClick={() => {
          localStorage.removeItem("zovia-admin-session");
          navigate("/admin/login");
        }}
      >
        Log Out
      </button>
    </div>
  );
}

export default AdminSellers;
