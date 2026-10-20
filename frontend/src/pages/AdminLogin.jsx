
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success || !data.token) {
        throw new Error(data.message || "Login failed.");
      }

      if (data.seller?.role === "seller") {
        const session = {
          role: "seller",
          token: data.token,
          sellerId: data.seller.sellerId,
          name: data.seller.name,
          email: data.seller.email,
          shopName: data.seller.name,
        };

        localStorage.setItem(
          "zovia-admin-session",
          JSON.stringify(session)
        );

        navigate("/seller/dashboard");
        return;
      }

      if (data.seller?.role === "super-admin") {
        const session = {
          role: "super-admin",
          token: data.token,
          name: data.seller.name,
          email: data.seller.email,
        };

        localStorage.setItem(
          "zovia-admin-session",
          JSON.stringify(session)
        );

        navigate("/admin");
        return;
      }

      throw new Error("This account does not have a supported role.");
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Backend connect aagala. Backend server running-ah check pannu."
          : err.message || "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <section className="admin-login-brand">
        <Link to="/" className="admin-login-logo">
          ZOVIA
        </Link>

        <div className="admin-brand-content">
          <span className="admin-brand-eyebrow">
            ZOVIA BUSINESS PORTAL
          </span>

          <h1>
            Manage.
            <br />
            Sell.
            <br />
            <span>Grow.</span>
          </h1>

          <p>
            Manage your products, inventory, orders and
            deliveries from one powerful workspace.
          </p>
        </div>

        <div className="admin-brand-footer">
          <span>SECURE BUSINESS ACCESS</span>
          <span>© 2026 ZOVIA</span>
        </div>
      </section>

      <section className="admin-login-section">
        <div className="admin-login-card">
          <div className="login-heading">
            <div className="login-icon">⇥</div>

            <span className="login-eyebrow">
              ADMIN PORTAL
            </span>

            <h2>Welcome back</h2>

            <p>
              Sign in to access your ZOVIA dashboard.
            </p>
          </div>

          <form
            className="admin-login-form"
            onSubmit={handleSubmit}
          >
            <div className="login-field">
              <label htmlFor="email">
                EMAIL ADDRESS
              </label>

              <input
                id="email"
                type="email"
                name="email"
                placeholder="admin@zovia.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">
                PASSWORD
              </label>

              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="admin-login-button"
              disabled={loading}
            >
              <span>
                {loading ? "LOGGING IN..." : "LOGIN TO DASHBOARD"}
              </span>
              <strong>→</strong>
            </button>
          </form>

          <div className="seller-register-box">
            <div>
              <span>NEW TO ZOVIA?</span>
              <strong>Sell your products with us.</strong>
            </div>

            <Link to="/seller/register">
              CREATE SELLER ACCOUNT
              <span>→</span>
            </Link>
          </div>

          <div className="login-security">
            <span className="security-dot"></span>
            <span>Secure business access</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminLogin;

