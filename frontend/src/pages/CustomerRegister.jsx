
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./CustomerAuth.css";

export default function CustomerRegister() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      navigate("/shop", { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <main className="customer-auth-page">
      <section className="customer-auth-card">
        <Link to="/" className="customer-auth-logo">
          ZOVIA
        </Link>

        <span className="customer-auth-eyebrow">JOIN ZOVIA</span>
        <h1>Create your account</h1>
        <p className="customer-auth-description">
          A little style, a little beauty, all in one place.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="customer-name">Full name</label>
          <input
            id="customer-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your full name"
            autoComplete="name"
            maxLength={80}
            required
          />

          <label htmlFor="customer-register-email">Email address</label>
          <input
            id="customer-register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="customer-register-password">Password</label>
          <input
            id="customer-register-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />

          <label htmlFor="customer-confirm-password">
            Confirm password
          </label>
          <input
            id="customer-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Enter password again"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
          />

          {error && <p className="customer-auth-error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="customer-auth-switch">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>

        <Link to="/" className="customer-auth-back">
          ← Back to home
        </Link>
      </section>
    </main>
  );
}
