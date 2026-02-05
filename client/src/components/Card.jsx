import React from "react";

const Card = ({
  card,
  onClick,
  disabled = false,
  size = "md",
  className = "",
}) => {
  const sizeClass = `size-${size}`;
  const colorClass = `color-${card.color}`;

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`game-card ${sizeClass} ${colorClass} ${disabled ? "disabled" : ""} ${className}`}
      style={{ boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)" }}
    >
      <div className="card-value">{card.value}</div>
      <div className="card-title">{card.title}</div>
      <div className="card-text">{card.text}</div>
    </div>
  );
};

export const CardBack = ({ size = "sm", className = "" }) => {
  return (
    <div className={`card-back size-${size} ${className}`}>
      <span>SPARK</span>
    </div>
  );
};

export default Card;
