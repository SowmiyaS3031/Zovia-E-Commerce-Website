
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./CustomerAuth.css";

export default function CustomerLogin() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await login({
        email: email.trim(),
        password,
      });

      navigate("/shop", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    }
  };

  return (
    <main className="customer-auth-page">
      <section className="customer-auth-card">
        <Link to="/" className="customer-auth-logo">
          ZOVIA
        </Link>

        <span className="customer-auth-eyebrow">WELCOME BACK</span>
        <h1>Sign in to ZOVIA</h1>
        <p className="customer-auth-description">
          Sign in to explore your account and continue shopping.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="customer-email">Email address</label>
          <input
            id="customer-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="customer-password">Password</label>
          <input
            id="customer-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          {error && <p className="customer-auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="customer-auth-switch">
          New to ZOVIA?{" "}
          <Link to="/register">Create an account</Link>
        </p>

        <Link to="/" className="customer-auth-back">
          ← Back to home
        </Link>
      </section>
    </main>
  );
}
