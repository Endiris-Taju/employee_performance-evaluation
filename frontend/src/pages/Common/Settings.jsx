import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageShell from "../../components/layout/PageShell";

export default function Settings() {
  const { theme, toggleTheme, role } = useAuth();

  const backPath =
    role === "admin" ? "/admin" : role === "leader" ? "/leader" : "/employee";

  return (
    <PageShell title="Settings" subtitle="Preferences and account" backTo={backPath}>
      <div className="card stack">
        <h3 style={{ marginTop: 0 }}>Appearance</h3>
        <label style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="checkbox"
            checked={theme === "dark"}
            onChange={toggleTheme}
          />
          <span>Dark theme</span>
        </label>
      </div>

      <div className="card stack">
        <h3 style={{ marginTop: 0 }}>Account</h3>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Update your name, contact info, photo, and password on the profile page.
        </p>
        <Link to="/profile" className="btn primary" style={{ width: "fit-content" }}>
          Open profile
        </Link>
      </div>
    </PageShell>
  );
}
