// src/pages/Auth/LoginForm.jsx
import React, { useState, useEffect } from "react";
import "./LoginForm.css";
import logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertTriangle, FiLogIn } from "react-icons/fi";

const LoginForm = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(""); // Clear error when user starts typing
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

      // Navigate by role returned from backend
      if (res.role === "admin") navigate("/");
      else if (res.role === "leader") navigate("/leader");
      else navigate("/employee");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="overlay" />
      
      <div className="login-card">
        <div className="login-header">
          <img src={logo} alt="Logo" className="logo" />
          <h2 className="title">Performance Management System</h2>
          <p className="subtitle">Secure sign-in to continue</p>
          <div className="time-display">
            {currentTime.toLocaleTimeString()} • {currentTime.toLocaleDateString()}
          </div>
        </div>

        <form className="login-box" onSubmit={handleSubmit}>
          <h3 className="form-title">Sign in</h3>
          <p className="form-subtitle">Use your organization email and password</p>
          
          {error && (
            <div className="error-message">
              <span className="error-icon"><FiAlertTriangle /></span>
              {error}
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon"><FiMail /></span>
              <input
                name="email"
                type="email"
                placeholder="Enter your email"
                className="input"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><FiLock /></span>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="input"
                value={form.password}
                onChange={handleChange}
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

          <button 
            className={`sign-in-btn ${loading ? 'loading' : ''}`} 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                <span className="btn-icon"><FiLogIn /></span>
                Continue
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
