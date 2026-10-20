
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SellerAddProduct.css";

function SellerAddProduct() {
  const navigate = useNavigate();

  const [session] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("zovia-admin-session") || "null"
      );
    } catch {
      return null;
    }
  });

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "fashion",
    image: "",
    stock: "",
    description: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!session || session.role !== "seller") {
    return (
      <div className="seller-product-access">
        <h2>Seller login required</h2>
        <Link to="/admin/login">Go to login</Link>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.price ||
      !form.image.trim() ||
      form.stock === "" ||
      !form.description.trim()
    ) {
      setMessage("Please fill in all product details.");
      return;
    }

    if (
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) <= 0 ||
      !Number.isInteger(Number(form.stock)) ||
      Number(form.stock) < 0
    ) {
      setMessage("Enter a valid price and stock quantity.");
      return;
    }

    if (!session.token) {
      setMessage("Login session token missing. Please login again.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            name: form.name.trim(),
            price: Number(form.price),
            category: form.category,
            image: form.image.trim(),
            stock: Number(form.stock),
            description: form.description.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Unable to save product to database."
        );
      }

      window.dispatchEvent(new Event("zovia-products-updated"));

      setMessage("Product saved to database successfully!");

      setTimeout(() => {
        navigate("/seller/products");
      }, 1000);
    } catch (error) {
      setMessage(
        error.message === "Failed to fetch"
          ? "Backend connect aagala. Backend server running-ah check pannu."
          : error.message || "Unable to save product. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="seller-add-product-page">
      <header className="seller-product-topbar">
        <Link to="/seller/dashboard" className="seller-product-logo">
          ZOVIA
        </Link>
        <span>{session.shopName}</span>
      </header>

      <main className="seller-product-container">
        <Link
          to="/seller/dashboard"
          className="seller-product-back"
        >
          ← Back to dashboard
        </Link>

        <div className="seller-product-heading">
          <span>PRODUCT MANAGEMENT</span>
          <h1>Add a new product</h1>
          <p>Add an item to your shop's product catalogue.</p>
        </div>

        <form
          className="seller-product-form"
          onSubmit={handleSubmit}
        >
          <div className="seller-product-field">
            <label htmlFor="product-name">PRODUCT NAME</label>
            <input
              id="product-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Elegant Summer Dress"
              required
            />
          </div>

          <div className="seller-product-two-columns">
            <div className="seller-product-field">
              <label htmlFor="product-price">PRICE (₹)</label>
              <input
                id="product-price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="1499"
                required
              />
            </div>

            <div className="seller-product-field">
              <label htmlFor="product-stock">STOCK QUANTITY</label>
              <input
                id="product-stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={handleChange}
                placeholder="25"
                required
              />
            </div>
          </div>

          <div className="seller-product-field">
            <label htmlFor="product-category">CATEGORY</label>
            <select
              id="product-category"
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              <option value="fashion">Fashion</option>
              <option value="makeup">Makeup</option>
              <option value="skincare">Skincare</option>
              <option value="shoes">Shoes</option>
              <option value="bags">Bags</option>
              <option value="jewellery">Jewellery</option>
              <option value="watches">Watches</option>
              <option value="perfumes">Perfumes</option>
            </select>
          </div>

          <div className="seller-product-field">
            <label htmlFor="product-image">PRODUCT IMAGE URL</label>
            <input
              id="product-image"
              name="image"
              type="url"
              value={form.image}
              onChange={handleChange}
              placeholder="https://example.com/product.jpg"
              required
            />
            <span>Paste a publicly accessible image URL.</span>
          </div>

          {form.image && (
            <div className="seller-product-image-preview">
              <img
                src={form.image}
                alt="Product preview"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                onLoad={(e) => {
                  e.currentTarget.style.display = "block";
                }}
              />
            </div>
          )}

          <div className="seller-product-field">
            <label htmlFor="product-description">DESCRIPTION</label>
            <textarea
              id="product-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your product..."
              rows={4}
              required
            />
          </div>

          <div className="seller-product-owner">
            <span>PRODUCT OWNER</span>
            <strong>{session.shopName}</strong>
            <small>Seller ID: {session.sellerId}</small>
          </div>

          {message && (
            <p className="seller-product-message" role="status">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="seller-product-submit"
            disabled={loading}
          >
            {loading ? "SAVING PRODUCT..." : "SAVE PRODUCT →"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default SellerAddProduct;
