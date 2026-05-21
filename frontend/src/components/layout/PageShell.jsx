import React from "react";
import { Link } from "react-router-dom";

export default function PageShell({
  title,
  subtitle,
  backTo,
  backLabel = "Back",
  actions,
  children,
  wide = false,
}) {
  return (
    <div className={`page-shell ${wide ? "page-shell--wide" : ""}`}>
      {(title || actions) && (
        <header className="page-shell__header">
          <div className="page-shell__intro">
            {backTo && (
              <Link to={backTo} className="page-shell__back">
                ← {backLabel}
              </Link>
            )}
            {title && <h1 className="page-shell__title">{title}</h1>}
            {subtitle && <p className="page-shell__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="page-shell__actions">{actions}</div>}
        </header>
      )}
      <div className="page-shell__body">{children}</div>
    </div>
  );
}
