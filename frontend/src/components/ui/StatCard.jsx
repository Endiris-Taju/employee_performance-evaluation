import React from "react";

export default function StatCard({ label, value, hint, icon: Icon, variant = "default" }) {
  return (
    <div className={`stat-card stat-card--${variant}`}>
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        {Icon && (
          <span className="stat-card__icon" aria-hidden>
            <Icon />
          </span>
        )}
      </div>
      <div className="stat-card__value">{value}</div>
      {hint && <p className="stat-card__hint">{hint}</p>}
    </div>
  );
}
