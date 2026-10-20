
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./OffersCoupons.css";

const STORAGE_KEY = "zovia-coupons";

const emptyForm = {
  code: "",
  type: "percentage",
  value: "",
  minOrder: "0",
  maxDiscount: "",
  startDate: new Date().toISOString().slice(0, 10),
  expiryDate: "",
};

function readCoupons() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getCouponStatus(coupon) {
  const today = new Date().toISOString().slice(0, 10);

  if (!coupon.active) return "Inactive";
  if (coupon.startDate && coupon.startDate > today) return "Scheduled";
  if (coupon.expiryDate && coupon.expiryDate < today) return "Expired";

  return "Active";
}

export default function OffersCoupons() {
  const [coupons, setCoupons] = useState(readCoupons);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
    } catch {
      setError("Could not save coupons in this browser.");
    }
  }, [coupons]);

  const activeCount = coupons.filter(
    (coupon) => getCouponStatus(coupon) === "Active"
  ).length;

  const scheduledCount = coupons.filter(
    (coupon) => getCouponStatus(coupon) === "Scheduled"
  ).length;

  const expiredCount = coupons.filter(
    (coupon) => getCouponStatus(coupon) === "Expired"
  ).length;

  const filteredCoupons = useMemo(() => {
    const query = search.trim().toUpperCase();

    return coupons.filter((coupon) => {
      const matchesSearch =
        coupon.code.toUpperCase().includes(query) ||
        coupon.type.toUpperCase().includes(query);

      const status = getCouponStatus(coupon);
      const matchesStatus =
        statusFilter === "all" ||
        status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [coupons, search, statusFilter]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setMessage("");
  };

  const saveCoupon = (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const code = form.code.trim().toUpperCase();
    const value = Number(form.value);
    const minOrder = Number(form.minOrder || 0);
    const maxDiscount =
      form.maxDiscount === "" ? null : Number(form.maxDiscount);

    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      setError("Use 3–30 characters: letters, numbers, _ or -.");
      return;
    }

    if (
      coupons.some(
        (coupon) =>
          coupon.code.toUpperCase() === code &&
          coupon.id !== editingId
      )
    ) {
      setError("This coupon code already exists.");
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a discount value greater than zero.");
      return;
    }

    if (form.type === "percentage" && value > 100) {
      setError("Percentage discount cannot exceed 100%.");
      return;
    }

    if (!Number.isFinite(minOrder) || minOrder < 0) {
      setError("Minimum order amount cannot be negative.");
      return;
    }

    if (
      maxDiscount !== null &&
      (!Number.isFinite(maxDiscount) || maxDiscount <= 0)
    ) {
      setError("Maximum discount must be greater than zero.");
      return;
    }

    if (
      form.type === "fixed" &&
      maxDiscount !== null
    ) {
      setError("Maximum discount is only needed for percentage coupons.");
      return;
    }

    if (!form.startDate || !form.expiryDate) {
      setError("Please select both start and expiry dates.");
      return;
    }

    if (form.expiryDate < form.startDate) {
      setError("Expiry date must be on or after the start date.");
      return;
    }

    const couponData = {
      id: editingId || `coupon-${Date.now()}`,
      code,
      type: form.type,
      value,
      minOrder,
      maxDiscount,
      startDate: form.startDate,
      expiryDate: form.expiryDate,
      active: editingId
        ? coupons.find((coupon) => coupon.id === editingId)?.active ?? true
        : true,
      updatedAt: new Date().toISOString(),
    };

    setCoupons((current) =>
      editingId
        ? current.map((coupon) =>
            coupon.id === editingId ? couponData : coupon
          )
        : [couponData, ...current]
    );

    setMessage(editingId ? "Coupon updated successfully." : "Coupon created successfully.");
    setForm(emptyForm);
    setEditingId(null);
  };

  const editCoupon = (coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      minOrder: String(coupon.minOrder ?? 0),
      maxDiscount:
        coupon.maxDiscount == null ? "" : String(coupon.maxDiscount),
      startDate: coupon.startDate || "",
      expiryDate: coupon.expiryDate || "",
    });
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleCoupon = (id) => {
    setCoupons((current) =>
      current.map((coupon) =>
        coupon.id === id
          ? { ...coupon, active: !coupon.active }
          : coupon
      )
    );
    setMessage("Coupon status updated.");
    setError("");
  };

  const deleteCoupon = (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;

    setCoupons((current) =>
      current.filter((item) => item.id !== coupon.id)
    );

    if (editingId === coupon.id) resetForm();

    setMessage(`${coupon.code} deleted.`);
    setError("");
  };

  return (
    <main className="zovia-offers-page">
      <header className="zo-topbar">
        <Link to="/" className="zo-brand">
          ZOVIA<span>•</span>
          <small>STORE MANAGEMENT</small>
        </Link>

        <Link to="/admin/dashboard" className="zo-back-link">
          ← Admin dashboard
        </Link>
      </header>

      <div className="zo-content">
        <div className="zo-heading">
          <div>
            <span className="zo-eyebrow">MARKETING WORKSPACE</span>
            <h1>Offers &amp; Coupons</h1>
            <p>Create discounts and manage promotional coupon codes.</p>
          </div>
          <div className="zo-heading-icon">%</div>
        </div>

        <section className="zo-stats">
          <article className="zo-stat-card">
            <span className="zo-stat-icon purple">%</span>
            <span className="zo-stat-label">Total coupons</span>
            <strong>{coupons.length}</strong>
            <small>All created coupon codes</small>
          </article>

          <article className="zo-stat-card">
            <span className="zo-stat-icon green">✓</span>
            <span className="zo-stat-label">Active now</span>
            <strong>{activeCount}</strong>
            <small>Currently within their dates</small>
          </article>

          <article className="zo-stat-card">
            <span className="zo-stat-icon blue">◷</span>
            <span className="zo-stat-label">Scheduled</span>
            <strong>{scheduledCount}</strong>
            <small>Starting on a future date</small>
          </article>

          <article className="zo-stat-card">
            <span className="zo-stat-icon amber">⌛</span>
            <span className="zo-stat-label">Expired</span>
            <strong>{expiredCount}</strong>
            <small>Past the expiry date</small>
          </article>
        </section>

        <section className="zo-form-panel">
          <div className="zo-panel-heading">
            <div>
              <span className="zo-section-label">
                {editingId ? "EDIT PROMOTION" : "NEW PROMOTION"}
              </span>
              <h2>{editingId ? "Update coupon" : "Create a coupon"}</h2>
              <p>Choose a discount and set the rules for your offer.</p>
            </div>
            <span className="zo-panel-symbol">✦</span>
          </div>

          <form onSubmit={saveCoupon} className="zo-coupon-form">
            <div className="zo-form-grid">
              <label className="zo-field">
                <span>Coupon code *</span>
                <input
                  name="code"
                  value={form.code}
                  onChange={updateField}
                  placeholder="e.g. ZOVIA10"
                  maxLength={30}
                  required
                />
                <small>Letters, numbers, hyphen or underscore.</small>
              </label>

              <label className="zo-field">
                <span>Discount type *</span>
                <select
                  name="type"
                  value={form.type}
                  onChange={updateField}
                >
                  <option value="percentage">Percentage discount (%)</option>
                  <option value="fixed">Fixed amount (₹)</option>
                </select>
              </label>

              <label className="zo-field">
                <span>
                  Discount value * {form.type === "percentage" ? "(%)" : "(₹)"}
                </span>
                <input
                  name="value"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={form.type === "percentage" ? "100" : undefined}
                  value={form.value}
                  onChange={updateField}
                  placeholder={form.type === "percentage" ? "10" : "200"}
                  required
                />
              </label>

              <label className="zo-field">
                <span>Minimum order amount (₹)</span>
                <input
                  name="minOrder"
                  type="number"
                  min="0"
                  step="1"
                  value={form.minOrder}
                  onChange={updateField}
                  required
                />
              </label>

              {form.type === "percentage" && (
                <label className="zo-field">
                  <span>Maximum discount (₹)</span>
                  <input
                    name="maxDiscount"
                    type="number"
                    min="0.01"
                    step="1"
                    value={form.maxDiscount}
                    onChange={updateField}
                    placeholder="e.g. 500 (optional)"
                  />
                  <small>Leave empty for no maximum cap.</small>
                </label>
              )}

              <label className="zo-field">
                <span>Start date *</span>
                <input
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={updateField}
                  required
                />
              </label>

              <label className="zo-field">
                <span>Expiry date *</span>
                <input
                  name="expiryDate"
                  type="date"
                  min={form.startDate}
                  value={form.expiryDate}
                  onChange={updateField}
                  required
                />
              </label>
            </div>

            {error && <div className="zo-feedback error">{error}</div>}
            {message && <div className="zo-feedback success">{message}</div>}

            <div className="zo-form-actions">
              {editingId && (
                <button
                  type="button"
                  className="zo-button secondary"
                  onClick={resetForm}
                >
                  Cancel edit
                </button>
              )}
              <button type="submit" className="zo-button primary">
                {editingId ? "Save changes" : "+ Create coupon"}
              </button>
            </div>
          </form>
        </section>

        <section className="zo-list-panel">
          <div className="zo-panel-heading zo-list-heading">
            <div>
              <span className="zo-section-label">PROMOTION LIBRARY</span>
              <h2>Your coupons</h2>
              <p>Manage existing coupon codes and their availability.</p>
            </div>
            <span className="zo-count-pill">{coupons.length} total</span>
          </div>

          <div className="zo-toolbar">
            <label className="zo-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search coupon code..."
                aria-label="Search coupons"
              />
            </label>

            <select
              className="zo-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter coupons by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="scheduled">Scheduled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {filteredCoupons.length > 0 ? (
            <div className="zo-coupon-list">
              {filteredCoupons.map((coupon) => {
                const status = getCouponStatus(coupon);

                return (
                  <article className="zo-coupon-card" key={coupon.id}>
                    <div className="zo-coupon-ticket">
                      <span>{coupon.type === "percentage" ? "%" : "₹"}</span>
                      <strong>
                        {coupon.type === "percentage"
                          ? `${coupon.value}%`
                          : money(coupon.value)}
                      </strong>
                      <small>DISCOUNT</small>
                    </div>

                    <div className="zo-coupon-details">
                      <div className="zo-coupon-code-row">
                        <h3>{coupon.code}</h3>
                        <span
                          className={`zo-status-badge ${status.toLowerCase()}`}
                        >
                          {status}
                        </span>
                      </div>

                      <p>
                        Minimum order {money(coupon.minOrder)}
                        {coupon.type === "percentage" &&
                        coupon.maxDiscount != null
                          ? ` · Max discount ${money(coupon.maxDiscount)}`
                          : ""}
                      </p>

                      <small>
                        {coupon.startDate} — {coupon.expiryDate}
                      </small>
                    </div>

                    <div className="zo-coupon-actions">
                      <button
                        type="button"
                        className="zo-action-button"
                        onClick={() => editCoupon(coupon)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className={`zo-action-button ${
                          coupon.active ? "deactivate" : "activate"
                        }`}
                        onClick={() => toggleCoupon(coupon.id)}
                      >
                        {coupon.active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        type="button"
                        className="zo-action-button delete"
                        onClick={() => deleteCoupon(coupon)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="zo-empty">
              <span>％</span>
              <h3>{coupons.length ? "No matching coupons" : "No coupons yet"}</h3>
              <p>
                {coupons.length
                  ? "Try a different search or status filter."
                  : "Create your first coupon above to start offering discounts."}
              </p>
              {coupons.length > 0 && (
                <button
                  type="button"
                  className="zo-button secondary"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          <footer className="zo-list-footer">
            <span>Saved in this browser</span>
            <span>{filteredCoupons.length} coupon(s) shown</span>
          </footer>
        </section>

        <p className="zo-note">
          Note: This page manages coupon settings in localStorage. Coupon
          validation and discount application at checkout will be connected
          separately. Production use requires server-side validation.
        </p>
      </div>
    </main>
  );
}
