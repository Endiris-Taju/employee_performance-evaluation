import React from "react";

const Card = ({ title, description, actions, children, className = "" }) => {
  return (
    <div className={"card" + (className ? ` ${className}` : "")}>
      {(title || actions) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          {title && <h3 style={{ margin: 0 }}>{title}</h3>}
          {actions}
        </div>
      )}
      {description && <p style={{ marginTop: 0 }}>{description}</p>}
      {children}
    </div>
  );
};

export default Card;



