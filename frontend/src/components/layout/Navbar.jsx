import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useAuth } from "../../context/AuthContext";
import {
  FiMenu,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiUser,
  FiSettings,
  FiMoon,
  FiSun,
} from "react-icons/fi";
import NotificationBell from "../NotificationBell";
import {
  ADMIN_NAV,
  LEADER_NAV,
  EMPLOYEE_NAV,
  NAV_SECONDARY,
} from "../../config/navConfig";
import "./Navbar.css";

function NavItem({ to, icon: Icon, label, end, collapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `sidebar-nav__link ${isActive ? "is-active" : ""}`
      }
      onClick={onNavigate}
      title={collapsed ? label : undefined}
    >
      <span className="sidebar-nav__icon">
        <Icon />
      </span>
      {!collapsed && <span className="sidebar-nav__label">{label}</span>}
    </NavLink>
  );
}

export default function Navbar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const { role, logout, name, email, theme, toggleTheme } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef(null);

  const navItems =
    role === "admin"
      ? ADMIN_NAV
      : role === "leader"
        ? LEADER_NAV
        : EMPLOYEE_NAV;

  useEffect(() => {
    function onClickOutside(e) {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = (name || email || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${collapsed ? "is-collapsed" : ""} ${
          mobileOpen ? "is-mobile-open" : ""
        }`}
      >
        <div className="sidebar__brand">
          <img src={logo} alt="" className="sidebar__logo" />
          {!collapsed && (
            <div className="sidebar__brand-text">
              <span className="sidebar__app-name">PMS</span>
              <span className="sidebar__app-tag">Performance</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav__section">
            {!collapsed && <span className="sidebar-nav__heading">Menu</span>}
            {navItems.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                collapsed={collapsed}
                onNavigate={closeMobile}
              />
            ))}
          </div>

          <div className="sidebar-nav__section">
            {!collapsed && <span className="sidebar-nav__heading">Account</span>}
            {NAV_SECONDARY.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                collapsed={collapsed}
                onNavigate={closeMobile}
              />
            ))}
          </div>
        </nav>

        <div className="sidebar__footer">
          <button
            type="button"
            className="sidebar-nav__link sidebar-nav__link--danger"
            onClick={handleLogout}
            title={collapsed ? "Sign out" : undefined}
          >
            <span className="sidebar-nav__icon">
              <FiLogOut />
            </span>
            {!collapsed && <span className="sidebar-nav__label">Sign out</span>}
          </button>
        </div>
      </aside>

      <header className="topbar">
        <div className="topbar__left">
          <button
            type="button"
            className="btn icon-only ghost topbar__menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu />
          </button>
          <button
            type="button"
            className="btn icon-only ghost hide-mobile"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        <div className="topbar__right">
          <button
            type="button"
            className="btn icon-only ghost"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <FiSun /> : <FiMoon />}
          </button>
          <NotificationBell />

          <div className="topbar-user" ref={userRef}>
            <button
              type="button"
              className="topbar-user__btn"
              onClick={() => setUserOpen(!userOpen)}
            >
              <span className="topbar-user__avatar">{initials}</span>
              <span className="topbar-user__info hide-mobile">
                <span className="topbar-user__name">{name || "User"}</span>
                <span className="topbar-user__role">{role}</span>
              </span>
            </button>
            {userOpen && (
              <div className="topbar-user__menu">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/profile");
                    setUserOpen(false);
                  }}
                >
                  <FiUser /> Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate("/settings");
                    setUserOpen(false);
                  }}
                >
                  <FiSettings /> Settings
                </button>
                <hr />
                <button type="button" onClick={handleLogout}>
                  <FiLogOut /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
