import React from "react";
import { FiChevronRight } from "react-icons/fi";

export default function ActionCard({ title, description, icon: Icon, onClick }) {
  return (
    <button type="button" className="action-card" onClick={onClick}>
      <div className="action-card__icon">{Icon && <Icon />}</div>
      <div className="action-card__body">
        <span className="action-card__title">{title}</span>
        {description && <span className="action-card__desc">{description}</span>}
      </div>
      <FiChevronRight className="action-card__arrow" aria-hidden />
    </button>
  );
}
