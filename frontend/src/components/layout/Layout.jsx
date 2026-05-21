import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

function Layout({ collapsed, setCollapsed }) {
  return (
    <div className="app-shell">
      <Navbar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`app-main ${collapsed ? "is-collapsed" : ""}`}>
        <div className="topbar-spacer" aria-hidden />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
