
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SellerRegister.css";

const API_URL = "http://localhost:5000/api";

function SellerRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    shopAddress: "",
    businessCategory: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const {
      shopName,
      ownerName,
      email,
      phone,
      password,
      confirmPassword,
      shopAddress,
      businessCategory,
    } = formData;

    if (
      !shopName.trim() ||
      !ownerName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !confirmPassword ||
      !shopAddress.trim() ||
      !businessCategory
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError("Password must contain 8 to 72 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: ownerName.trim(),
          email: email.trim().toLowerCase(),
          password,
          shopName: shopName.trim(),
          phone: phone.trim(),
          shopAddress: shopAddress.trim(),
          businessCategory,
        }),
      });

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Backend JSON response varala (HTTP ${response.status}). Check backend route and API URL.`
        );
      }

      if (!response.ok || !data.success || !data.seller) {
        throw new Error(data.message || "Registration failed.");
      }

      const savedSellerDetails = {
        sellerId: data.seller.sellerId,
        shopName: data.seller.shopName || shopName.trim(),
        ownerName: data.seller.name || ownerName.trim(),
        email: data.seller.email || email.trim().toLowerCase(),
        phone: data.seller.phone || phone.trim(),
        shopAddress: data.seller.shopAddress || shopAddress.trim(),
        businessCategory:
          data.seller.businessCategory || businessCategory,
        status: "Active",
        createdAt: new Date().toISOString(),
      };

      let savedSellers = [];

      try {
        const existing = JSON.parse(
          localStorage.getItem("zovia-sellers") || "[]"
        );

        if (Array.isArray(existing)) {
          savedSellers = existing;
        }
      } catch {
        savedSellers = [];
      }

      localStorage.setItem(
        "zovia-sellers",
        JSON.stringify([
          ...savedSellers.filter(
            (seller) => seller.email !== savedSellerDetails.email
          ),
          savedSellerDetails,
        ])
      );

      setSuccess(
        `Seller account created successfully! Your Seller ID is ${savedSellerDetails.sellerId}.`
      );

      setTimeout(() => {
        navigate("/admin/login");
      }, 1800);
    } catch (err) {
      console.error("Seller registration error:", err);

      if (err.message === "Failed to fetch") {
        setError(
          "Backend connect aagala. Check backend server, port 5000 and CORS settings."
        );
      } else {
        setError(err.message || "Unable to register. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-register-page">
      <section className="seller-register-brand">
        <Link to="/" className="seller-register-logo">
          ZOVIA
        </Link>

        <div className="seller-brand-content">
          <span className="seller-brand-eyebrow">
            JOIN ZOVIA SELLERS
          </span>

          <h1>
            Build.
            <br />
            Sell.
            <br />
            <span>Grow.</span>
          </h1>

          <p>
            Bring your products to thousands of
            customers through the ZOVIA marketplace.
          </p>
        </div>

        <div className="seller-brand-points">
          <div>
            <span>01</span>
            <p>Manage your own products</p>
          </div>
          <div>
            <span>02</span>
            <p>Track your customer orders</p>
          </div>
          <div>
            <span>03</span>
            <p>Grow your online business</p>
          </div>
        </div>
      </section>

      <section className="seller-register-section">
        <div className="seller-register-card">
          <div className="seller-register-heading">
            <Link to="/admin/login" className="back-login">
              ← BACK TO LOGIN
            </Link>

            <span className="seller-register-eyebrow">
              SELLER REGISTRATION
            </span>

            <h2>Create your seller account</h2>

            <p>
              Enter your shop details to start selling
              with ZOVIA.
            </p>
          </div>

          <form
            className="seller-register-form"
            onSubmit={handleSubmit}
          >
            <div className="form-section-title">
              SHOP INFORMATION
            </div>

            <div className="form-grid">
              <div className="seller-field">
                <label htmlFor="shopName">SHOP NAME</label>
                <input
                  id="shopName"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  placeholder="Enter your shop name"
                  required
                />
              </div>

              <div className="seller-field">
                <label htmlFor="businessCategory">
                  BUSINESS CATEGORY
                </label>
                <select
                  id="businessCategory"
                  name="businessCategory"
                  value={formData.businessCategory}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Shoes">Shoes</option>
                  <option value="Bags">Bags</option>
                  <option value="Jewellery">Jewellery</option>
                  <option value="Watches">Watches</option>
                  <option value="Perfumes">Perfumes</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-section-title">
              OWNER INFORMATION
            </div>

            <div className="form-grid">
              <div className="seller-field">
                <label htmlFor="ownerName">OWNER NAME</label>
                <input
                  id="ownerName"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Enter owner name"
                  required
                />
              </div>

              <div className="seller-field">
                <label htmlFor="phone">PHONE NUMBER</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  maxLength={10}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>
            </div>

            <div className="seller-field">
              <label htmlFor="email">EMAIL ADDRESS</label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="shop@example.com"
                required
              />
            </div>

            <div className="seller-field">
              <label htmlFor="shopAddress">SHOP ADDRESS</label>
              <textarea
                id="shopAddress"
                name="shopAddress"
                rows={3}
                value={formData.shopAddress}
                onChange={handleChange}
                placeholder="Enter your complete shop address"
                required
              />
            </div>

            <div className="form-section-title">
              ACCOUNT SECURITY
            </div>

            <div className="form-grid">
              <div className="seller-field">
                <label htmlFor="password">PASSWORD</label>
                <div className="seller-password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              <div className="seller-field">
                <label htmlFor="confirmPassword">
                  CONFIRM PASSWORD
                </label>
                <div className="seller-password-wrapper">
                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword ? "text" : "password"
                    }
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                  >
                    {showConfirmPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="seller-form-error" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            {success && (
              <div className="seller-form-success" role="status">
                <span>✓</span>
                <div>
                  <strong>Account created successfully!</strong>
                  <p>{success}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="seller-register-button"
              disabled={loading}
            >
              <span>
                {loading
                  ? "CREATING ACCOUNT..."
                  : "CREATE SELLER ACCOUNT"}
              </span>
              <strong>→</strong>
            </button>
          </form>

          <div className="seller-login-footer">
            Already have a seller account?
            <Link to="/admin/login">Login here</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SellerRegister;
