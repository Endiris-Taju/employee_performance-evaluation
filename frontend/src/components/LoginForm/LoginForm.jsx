import React, { useState } from "react";
import logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertTriangle,
  FiLogIn,
} from "react-icons/fi";

const LoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await login({
        email: form.email,
        password: form.password,
      });

      if (!res.ok) {
        setError(res.message || "Login failed");
        return;
      }

      if (res.role === "admin") navigate("/");
      else if (res.role === "leader") navigate("/leader");
      else navigate("/employee");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-panel__brand">
          <img src={logo} alt="PMS logo" />
          <h1>Performance Management</h1>
          <p>Sign in with your organization account</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message" role="alert">
              <FiAlertTriangle aria-hidden />
              {error}
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="email">
              Email
            </label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden>
                <FiMail />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                className="input"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">
              Password
            </label>
            <div className="input-wrapper">
              <span className="input-icon" aria-hidden>
                <FiLock />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                className="input"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button className="sign-in-btn" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" aria-hidden /> Signing in…
              </>
            ) : (
              <>
                <FiLogIn aria-hidden /> Sign in
              </>
            )}
          </button>
        </form>

        <p
          style={{
            marginTop: 24,
            fontSize: "0.8125rem",
            color: "var(--muted)",
            textAlign: "center",
          }}
        >
          Demo: admin@example.com / password123
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
