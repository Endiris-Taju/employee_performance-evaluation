// src/components/Card.jsx
import React from "react";
import "./Card.css"; // optional, or style with Tailwind

const Card = ({ title, description, children }) => {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
};

export default Card;
