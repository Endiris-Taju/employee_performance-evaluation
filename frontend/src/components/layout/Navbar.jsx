// src/components/layout/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useAuth } from "../../context/AuthContext";
import {
  FiGrid,
  FiCamera,
  FiZap,
  FiUsers,
  FiLayers,
  FiFileText,
  FiCheckSquare,
  FiClipboard,
  FiSettings,
  FiMenu,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiUser,
  FiHome,
  FiTrendingUp,
  FiAward,
  FiCalendar,
} from "react-icons/fi";
import "./Navbar.css";

function Navbar({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const { role, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false); // mobile toggle
  const [settingsOpen, setSettingsOpen] = useState(false); // settings dropdown toggle
  const dropdownRef = useRef(null);

  // Close settings when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="nav-left" onClick={() => navigate("/")}>
          <div className="logo-area">
            <img src={logo} alt="logo" className="logo" />
          </div>
        </div>

        <div className="nav-right">
          {/* Mobile toggle button */}
          <button
            className="btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            <FiMenu />
          </button>

          {/* Collapse sidebar (desktop) */}
          <button
            className="btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle Collapse"
          >
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>

          {/* Settings dropdown */}
          <div className="settings-dropdown" ref={dropdownRef}>
            <button
              className="btn"
              onClick={() => setSettingsOpen(!settingsOpen)}
            >
              <FiSettings /> Settings
            </button>
            {settingsOpen && (
              <ul className="dropdown-menu">
                <li>
                  <button
                    className="dropdown-btn"
                    onClick={() => {
                      navigate("/profile");
                      setSettingsOpen(false);
                    }}
                  >
                    Profile
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-btn"
                    onClick={() => {
                      logout();
                      setSettingsOpen(false);
                      navigate("/login");
                    }}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar / Mobile Navigation */}
      <ul
        className={`nav-menu ${menuOpen ? "active" : ""} ${
          collapsed ? "collapsed" : ""
        }`}
      >
        {/* Admin */}
        {role === "admin" && (
          <>
            <li onClick={() => navigate("/admin")}>
              <span className="nav-icon"><FiHome /></span>
              <span className="nav-label">Dashboard</span>
            </li>
            <li onClick={() => navigate("/self-evaluation")}>
              <span className="nav-icon"><FiAward /></span>
              <span className="nav-label">Self Evaluation (5%)</span>
            </li>
            <li onClick={() => navigate("/attendance")}>
              <span className="nav-icon"><FiCamera /></span>
              <span className="nav-label">Attendance</span>
            </li>
            <li onClick={() => navigate("/employee-list")}>
              <span className="nav-icon"><FiUsers /></span>
              <span className="nav-label">Employees</span>
            </li>
            <li onClick={() => navigate("/teams")}>
              <span className="nav-icon"><FiLayers /></span>
              <span className="nav-label">Teams</span>
            </li>
            <li onClick={() => navigate("/evaluations")}>
              <span className="nav-icon"><FiAward /></span>
              <span className="nav-label">Evaluations</span>
            </li>
            <li onClick={() => navigate("/reports")}>
              <span className="nav-icon"><FiFileText /></span>
              <span className="nav-label">Reports</span>
            </li>
            <li onClick={() => navigate("/analytics")}>
              <span className="nav-icon"><FiTrendingUp /></span>
              <span className="nav-label">Analytics</span>
            </li>
          </>
        )}

        {/* Leader */}
        {role === "leader" && (
          <>
            <li onClick={() => navigate("/leader")}>
              <span className="nav-icon"><FiHome /></span>
              <span className="nav-label">ዋና ገጽ</span>
            </li>
            <li onClick={() => navigate("/attendance")}>
              <span className="nav-icon"><FiCamera /></span>
              <span className="nav-label">እለት መግቢያ</span>
            </li>
            <li onClick={() => navigate("/leader/tasks")}>
              <span className="nav-icon"><FiCheckSquare /></span>
              <span className="nav-label">ስራዎች</span>
            </li>
            <li onClick={() => navigate("/evaluations")}>
              <span className="nav-icon"><FiAward /></span>
              <span className="nav-label">ማለገጫ</span>
            </li>
            <li onClick={() => navigate("/leader/reports")}>
              <span className="nav-icon"><FiFileText /></span>
              <span className="nav-label">ዘገባዎች</span>
            </li>
            <li onClick={() => navigate("/calendar")}>
              <span className="nav-icon"><FiCalendar /></span>
              <span className="nav-label">ቀን መቁጠሪያ</span>
            </li>
          </>
        )}

        {/* Employee + Member */}
        {(role === "employee" || role === "member") && (
          <>
            <li onClick={() => navigate("/employee")}>
              <span className="nav-icon"><FiHome /></span>
              <span className="nav-label">Dashboard</span>
            </li>
            <li onClick={() => navigate("/attendance")}>
              <span className="nav-icon"><FiCamera /></span>
              <span className="nav-label">Attendance</span>
            </li>
            <li onClick={() => navigate("/self-evaluation")}>
              <span className="nav-icon"><FiAward /></span>
              <span className="nav-label">Self Evaluation (5%)</span>
            </li>
            <li onClick={() => navigate("/peerEvaluation")}>
              <span className="nav-icon"><FiUsers /></span>
              <span className="nav-label">Peer Evaluation (15%)</span>
            </li>
            <li onClick={() => navigate("/my-reports")}>
              <span className="nav-icon"><FiFileText /></span>
              <span className="nav-label">My Reports</span>
            </li>
            <li onClick={() => navigate("/profile")}>
              <span className="nav-icon"><FiUser /></span>
              <span className="nav-label">Profile</span>
            </li>
          </>
        )}

        {/* Logout - Common for all roles */}
        <li className="logout-item" onClick={() => handleLogout()}>
          <span className="nav-icon"><FiLogOut /></span>
          <span className="nav-label">መውጫ</span>
        </li>
      </ul>

      {/* Footer */}
      <footer className="nav-footer">© 2025 የኢትዮጵያ መንግስት ስርዓት እና የሰው ሃይል ልማት ቢሮ</footer>
    </>
  );
}

export default Navbar;
