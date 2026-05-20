import React from "react";

const Button = ({ variant = "default", children, className = "", ...props }) => {
  const base = "btn";
  const map = {
    default: "",
    primary: " primary",
    secondary: " secondary",
    danger: "",
  };
  return (
    <button className={base + (map[variant] || "") + (className ? ` ${className}` : "")} {...props}>
      {children}
    </button>
  );
};

export default Button;



