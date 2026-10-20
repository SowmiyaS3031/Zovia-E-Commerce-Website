
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useOrders } from "../context/OrderContext";
import "./CustomerManagement.css";

const readJSON = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const getCustomer = (order, index) => {
  const address =
    typeof order.address === "object" && order.address
      ? order.address
      : {};

  const name =
    order.customerName ||
    order.name ||
    address.fullName ||
    address.name ||
    order.shippingAddress?.fullName ||
    "Guest Customer";

  const email =
    order.customerEmail ||
    order.email ||
    address.email ||
    order.shippingAddress?.email ||
    "";

  const phone =
    order.customerPhone ||
    order.phone ||
    address.phone ||
    address.mobile ||
    order.shippingAddress?.phone ||
    "";

  const identity = String(email || phone || name).trim().toLowerCase();

  return {
    key: identity && name !== "Guest Customer"
      ? identity
      : `guest-${order.id || order.orderId || index}`,
    name,
    email,
    phone,
  };
};

function CustomerManagement() {
  const { orders = [] } = useOrders();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [blockedCustomers, setBlockedCustomers] = useState(() =>
    readJSON("zovia-blocked-customers", [])
  );

  const customers = useMemo(() => {
    const grouped = new Map();

    orders.forEach((order, index) => {
      const customer = getCustomer(order, index);

      if (!grouped.has(customer.key)) {
        grouped.set(customer.key, {
          ...customer,
          orders: [],
          totalSpent: 0,
        });
      }

      const existing = grouped.get(customer.key);
      existing.orders.push(order);
      existing.totalSpent += Number(
        order.total ?? order.totalAmount ?? 0
      );

      if (!existing.email && customer.email) {
        existing.email = customer.email;
      }

      if (!existing.phone && customer.phone) {
        existing.phone = customer.phone;
      }
    });

    return Array.from(grouped.values()).sort(
      (a, b) => b.totalSpent - a.totalSpent
    );
  }, [orders]);

  const filteredCustomers = customers.filter((customer) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.phone.toLowerCase().includes(query);

    const isBlocked = blockedCustomers.includes(customer.key);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "blocked" && isBlocked) ||
      (statusFilter === "active" && !isBlocked);

    return matchesSearch && matchesStatus;
  });

  const totalOrders = orders.length;

  const totalRevenue = orders.reduce(
    (sum, order) =>
      sum + Number(order.total ?? order.totalAmount ?? 0),
    0
  );

  const toggleBlocked = (customer) => {
    const updated = blockedCustomers.includes(customer.key)
      ? blockedCustomers.filter((key) => key !== customer.key)
      : [...blockedCustomers, customer.key];

    setBlockedCustomers(updated);
    localStorage.setItem(
      "zovia-blocked-customers",
      JSON.stringify(updated)
    );
  };

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const formatDate = (order) => {
    const date = order.createdAt || order.date || order.orderDate;

    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
      ? String(date)
      : parsed.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  return (
    <div className="cm-page">
      <header className="cm-topbar">
        <Link to="/admin" className="cm-brand">
          ZOVIA <span>ADMIN</span>
        </Link>

        <div className="cm-topbar-links">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/products">Products</Link>
        </div>
      </header>

      <main className="cm-content">
        <div className="cm-heading">
          <div>
            <span className="cm-eyebrow">CUSTOMER CENTRE</span>
            <h1>Customer Management</h1>
            <p>Understand your customers and their purchase history.</p>
          </div>

          <span className="cm-total-pill">
            {customers.length} customers
          </span>
        </div>

        <section className="cm-stats">
          <article className="cm-stat-card">
            <span className="cm-stat-icon cm-purple">♙</span>
            <p>Total Customers</p>
            <h2>{customers.length}</h2>
            <small>Customers found in order history</small>
          </article>

          <article className="cm-stat-card">
            <span className="cm-stat-icon cm-blue">▤</span>
            <p>Total Orders</p>
            <h2>{totalOrders}</h2>
            <small>Across all available customers</small>
          </article>

          <article className="cm-stat-card">
            <span className="cm-stat-icon cm-green">₹</span>
            <p>Total Order Value</p>
            <h2>{formatCurrency(totalRevenue)}</h2>
            <small>Value of recorded orders</small>
          </article>

          <article className="cm-stat-card">
            <span className="cm-stat-icon cm-orange">!</span>
            <p>Blocked Profiles</p>
            <h2>{blockedCustomers.length}</h2>
            <small>Saved in this browser</small>
          </article>
        </section>

        <section className="cm-panel">
          <div className="cm-panel-heading">
            <div>
              <h2>All Customers</h2>
              <p>Search customers and review their orders.</p>
            </div>
          </div>

          <div className="cm-toolbar">
            <div className="cm-search">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search name, email or phone..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter customer status"
            >
              <option value="all">All customers</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div className="cm-table-wrap">
            <table className="cm-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => {
                  const isBlocked = blockedCustomers.includes(customer.key);

                  return (
                    <tr key={customer.key}>
                      <td>
                        <div className="cm-customer-cell">
                          <span className="cm-avatar">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <strong>{customer.name}</strong>
                            <small>
                              {customer.orders.length} order
                              {customer.orders.length === 1 ? "" : "s"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="cm-contact">
                          <span>{customer.email || "No email provided"}</span>
                          <small>{customer.phone || "No phone provided"}</small>
                        </div>
                      </td>

                      <td>{customer.orders.length}</td>

                      <td className="cm-money">
                        {formatCurrency(customer.totalSpent)}
                      </td>

                      <td>
                        <span
                          className={`cm-status ${
                            isBlocked ? "is-blocked" : "is-active"
                          }`}
                        >
                          {isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>

                      <td>
                        <div className="cm-actions">
                          <button
                            className="cm-view-button"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            View
                          </button>

                          <button
                            className={`cm-block-button ${
                              isBlocked ? "is-unblock" : ""
                            }`}
                            onClick={() => toggleBlocked(customer)}
                          >
                            {isBlocked ? "Unblock" : "Block"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="cm-empty">
                        <span>♙</span>
                        <h3>No customers found</h3>
                        <p>
                          Customers will appear here when orders contain
                          customer information.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {selectedCustomer && (
          <div
            className="cm-modal-backdrop"
            onClick={() => setSelectedCustomer(null)}
          >
            <section
              className="cm-detail-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="cm-modal-heading">
                <div>
                  <span className="cm-eyebrow">CUSTOMER PROFILE</span>
                  <h2>{selectedCustomer.name}</h2>
                </div>

                <button
                  className="cm-close"
                  onClick={() => setSelectedCustomer(null)}
                  aria-label="Close customer details"
                >
                  ×
                </button>
              </div>

              <div className="cm-detail-grid">
                <div>
                  <small>Email</small>
                  <strong>{selectedCustomer.email || "Not provided"}</strong>
                </div>
                <div>
                  <small>Phone</small>
                  <strong>{selectedCustomer.phone || "Not provided"}</strong>
                </div>
                <div>
                  <small>Total Orders</small>
                  <strong>{selectedCustomer.orders.length}</strong>
                </div>
                <div>
                  <small>Total Spent</small>
                  <strong>{formatCurrency(selectedCustomer.totalSpent)}</strong>
                </div>
              </div>

              <h3 className="cm-history-title">Order History</h3>

              <div className="cm-history">
                {[...selectedCustomer.orders]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt || b.date || 0) -
                      new Date(a.createdAt || a.date || 0)
                  )
                  .map((order, index) => (
                    <div
                      className="cm-history-row"
                      key={order.id || order.orderId || index}
                    >
                      <div>
                        <strong>
                          #{order.orderId || order.id || `ORDER-${index + 1}`}
                        </strong>
                        <small>{formatDate(order)}</small>
                        <small>
                          {order.items?.length
                            ? order.items.map((item) => item.name).filter(Boolean).join(", ")
                            : order.productName || "Order details unavailable"}
                        </small>
                      </div>

                      <div className="cm-history-right">
                        <strong>
                          {formatCurrency(order.total ?? order.totalAmount)}
                        </strong>
                        <span className="cm-order-status">
                          {order.status || order.orderStatus || "Placed"}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="cm-modal-footer">
                <button
                  className="cm-done-button"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Done
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default CustomerManagement;
