import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useAuth } from "../../context/AuthContext";

const AppShell = ({ role, children }) => {
  const { logout } = useAuth();

 

  return (
    <div className="app-container">
      <main className="main">
        <section className="content container" style={{ paddingTop: 24, paddingBottom: 24 }}>
          {children}
        </section>
      </main>
      <footer className="footer" style={{ textAlign: 'center', padding: 12 }}>© 2025 All rights reserved</footer>
    </div>
  );
};

export default AppShell;



