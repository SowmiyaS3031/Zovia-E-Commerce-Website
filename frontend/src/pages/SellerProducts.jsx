import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./SellerProducts.css";

const API_URL = "http://localhost:5000/api";

function SellerProducts() {
  const [session] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("zovia-admin-session") || "null"
      );
    } catch {
      return null;
    }
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [addingStockId, setAddingStockId] = useState("");
  const [stockInputs, setStockInputs] = useState({});

  const fetchProducts = useCallback(async () => {
    if (!session || session.role !== "seller" || !session.token) {
      setLoading(false);
      setError("Please login again to view your products.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/products/mine`, {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load products.");
      }

      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (err) {
      setError(err.message || "Unable to load products.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddStock = async (productId) => {
    const quantity = Number(stockInputs[productId]);

    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      setError("Enter a whole number greater than zero.");
      return;
    }

    setAddingStockId(productId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/products/${productId}/stock`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ quantity }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success || !data.product) {
        throw new Error(data.message || "Unable to add stock.");
      }

      setProducts((current) =>
        current.map((product) =>
          product._id === productId ? data.product : product
        )
      );

      setStockInputs((current) => ({
        ...current,
        [productId]: "",
      }));

      setMessage(
        `Stock updated! ${data.product.name}: ${data.product.stock} available.`
      );

      window.dispatchEvent(new Event("zovia-products-updated"));
    } catch (err) {
      setError(err.message || "Unable to add stock.");
    } finally {
      setAddingStockId("");
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setDeletingId(productId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete product.");
      }

      setProducts((current) =>
        current.filter((product) => product._id !== productId)
      );

      window.dispatchEvent(new Event("zovia-products-updated"));
      setMessage("Product deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete product.");
    } finally {
      setDeletingId("");
    }
  };

  if (!session || session.role !== "seller" || !session.token) {
    return (
      <div className="seller-products-access">
        <h2>Seller login required</h2>
        <Link to="/admin/login">Go to login</Link>
      </div>
    );
  }

  return (
    <div className="seller-products-page">
      <header className="seller-products-header">
        <Link
          to="/seller/dashboard"
          className="seller-products-logo"
        >
          ZOVIA
        </Link>

        <span>{session.shopName || session.name || "My Shop"}</span>
      </header>

      <main className="seller-products-container">
        <Link
          to="/seller/dashboard"
          className="seller-products-back"
        >
          ← Back to dashboard
        </Link>

        <div className="seller-products-heading">
          <div>
            <span>YOUR CATALOGUE</span>
            <h1>My Products</h1>
            <p>Manage products, inventory and available stock.</p>
          </div>

          <Link
            to="/seller/products/add"
            className="seller-products-add"
          >
            + Add Product
          </Link>
        </div>

        <div className="seller-products-summary">
          <span>Total products</span>
          <strong>{products.length}</strong>
        </div>

        {error && (
          <p className="seller-product-message" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="seller-product-success" role="status">
            {message}
          </p>
        )}

        {loading ? (
          <div className="seller-products-empty">
            <h2>Loading your products...</h2>
          </div>
        ) : products.length === 0 ? (
          <div className="seller-products-empty">
            <div className="seller-products-empty-icon">◇</div>
            <h2>Your catalogue is waiting</h2>
            <p>Add your first product to start building your shop.</p>
            <Link
              to="/seller/products/add"
              className="seller-products-add"
            >
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="seller-products-grid">
            {products.map((product) => {
              const stock = Number(product.stock ?? 0);
              const productId = product._id;

              const stockStatus =
                stock <= 0
                  ? "seller-stock-empty"
                  : stock <= 5
                    ? "seller-stock-low"
                    : "seller-stock-ok";

              const stockLabel =
                stock <= 0
                  ? "Out of Stock"
                  : stock <= 5
                    ? "Low Stock"
                    : "In Stock";

              return (
                <article
                  className="seller-product-card"
                  key={productId}
                >
                  <div className="seller-product-card-image">
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(event) => {
                        event.currentTarget.style.visibility = "hidden";
                      }}
                    />

                    <span>{product.category}</span>
                  </div>

                  <div className="seller-product-card-content">
                    <h2>{product.name}</h2>

                    <strong className="seller-product-price">
                      ₹{Number(product.price).toLocaleString("en-IN")}
                    </strong>

                    <p className="seller-product-description">
                      {product.description || "No description available."}
                    </p>

                    <div className="seller-product-stock">
                      <span>Stock available</span>
                      <strong>{stock}</strong>
                    </div>

                    <p className={`seller-stock-status ${stockStatus}`}>
                      {stockLabel}
                    </p>

                    <div className="seller-add-stock">
                      <label htmlFor={`stock-${productId}`}>
                        Add quantity
                      </label>

                      <input
                        id={`stock-${productId}`}
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Enter quantity"
                        value={stockInputs[productId] ?? ""}
                        onChange={(event) =>
                          setStockInputs((current) => ({
                            ...current,
                            [productId]: event.target.value,
                          }))
                        }
                        disabled={
                          addingStockId === productId ||
                          deletingId === productId
                        }
                      />

                      <button
                        type="button"
                        className="seller-stock-add-button"
                        onClick={() => handleAddStock(productId)}
                        disabled={
                          addingStockId === productId ||
                          deletingId === productId ||
                          !stockInputs[productId]
                        }
                      >
                        {addingStockId === productId
                          ? "Updating..."
                          : "+ Add Stock"}
                      </button>
                    </div>

                    <button
                      type="button"
                      className="seller-product-delete"
                      onClick={() => handleDelete(productId)}
                      disabled={
                        deletingId === productId ||
                        addingStockId === productId
                      }
                    >
                      {deletingId === productId
                        ? "Deleting..."
                        : "Delete Product"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default SellerProducts;