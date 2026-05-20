// src/components/layout/Layout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import "./Layout.css";

function Layout({ collapsed, setCollapsed }) {
  return (
    <div className="app-layout">
      <Navbar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
