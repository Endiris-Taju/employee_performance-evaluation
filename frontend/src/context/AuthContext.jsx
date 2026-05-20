// src/context/AuthContext.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

// ✅ Backend URL from .env or fallback
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userId, setUserId] = useState(localStorage.getItem("userId") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  // Apply theme
  useEffect(() => {
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);
    // ✅ Login
    const login = useCallback(async ({ email: loginEmail, password }) => {
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail, password }),
        });
  
        const data = await res.json().catch(() => ({}));
  
        if (!res.ok) {
          return { ok: false, message: data.error || data.message || "Login failed" };
        }
  
        // Backend returns: { token, user: { id, email, role, name } }
        const user = data.user || {};
        const tokenVal = data.token || "";
        const userIdVal = user.id ?? "";
        const roleVal = user.role || "";
        const emailVal = user.email || loginEmail || "";
        const nameVal = user.name || (emailVal && emailVal.includes("@") ? emailVal.split("@")[0] : "");
  
        setToken(tokenVal);
        setUserId(String(userIdVal));
        setRole(roleVal);
        setEmail(emailVal);
        setName(nameVal);
  
        localStorage.setItem("token", tokenVal);
        localStorage.setItem("userId", String(userIdVal));
        localStorage.setItem("role", roleVal);
        localStorage.setItem("email", emailVal);
        localStorage.setItem("name", nameVal);
  
        return { ok: true, role: roleVal };
      } catch (err) {
        return { ok: false, message: err.message || "Network error" };
      }
    }, []);
  // ✅ Logout
  const logout = useCallback(() => {
    setToken("");
    setUserId("");
    setRole("");
    setEmail("");
    setName("");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({ token, userId, role, email, name, theme, login, logout, toggleTheme }),
    [token, userId, role, email, name, theme, login, logout, toggleTheme]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
