// src/components/ui/Skeleton.jsx
import React from "react";
import "./Skeleton.css";

function Skeleton({ 
  variant = "text", 
  width, 
  height, 
  className = "", 
  animation = "pulse",
  count = 1 
}) {
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`skeleton skeleton-${variant} skeleton-${animation} ${className}`}
      style={{ width, height }}
    />
  ));

  return count > 1 ? <div className="skeleton-group">{skeletons}</div> : skeletons;
}

// Skeleton Card component
function SkeletonCard({ lines = 3, hasButton = false }) {
  return (
    <div className="skeleton-card">
      <Skeleton variant="rectangular" height="200px" className="skeleton-card-image" />
      <div className="skeleton-card-content">
        <Skeleton variant="text" height="24px" width="80%" className="skeleton-card-title" />
        <div className="skeleton-card-lines">
          {Array.from({ length: lines }, (_, index) => (
            <Skeleton 
              key={index} 
              variant="text" 
              height="16px" 
              width={index === lines - 1 ? "60%" : "100%"} 
              className="skeleton-card-line" 
            />
          ))}
        </div>
        {hasButton && (
          <Skeleton variant="rectangular" height="40px" width="120px" className="skeleton-card-button" />
        )}
      </div>
    </div>
  );
}

// Skeleton Table component
function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} variant="text" height="20px" className="skeleton-table-header-cell" />
        ))}
      </div>
      <div className="skeleton-table-body">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="skeleton-table-row">
            {Array.from({ length: columns }, (_, colIndex) => (
              <Skeleton key={colIndex} variant="text" height="16px" className="skeleton-table-cell" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton Dashboard component
function SkeletonDashboard() {
  return (
    <div className="skeleton-dashboard">
      <div className="skeleton-dashboard-header">
        <Skeleton variant="text" height="40px" width="300px" />
        <Skeleton variant="text" height="20px" width="500px" />
      </div>
      
      <div className="skeleton-stats-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="skeleton-stat-box">
            <Skeleton variant="rectangular" height="60px" width="60px" className="skeleton-stat-icon" />
            <div className="skeleton-stat-content">
              <Skeleton variant="text" height="32px" width="80px" />
              <Skeleton variant="text" height="16px" width="120px" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="skeleton-cards-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonCard key={index} lines={2} hasButton />
        ))}
      </div>
    </div>
  );
}

// Loading Spinner component
function LoadingSpinner({ size = "medium", className = "" }) {
  return (
    <div className={`loading-spinner loading-spinner-${size} ${className}`}>
      <div className="spinner-circle"></div>
    </div>
  );
}

// Loading Overlay component
function LoadingOverlay({ message = "Loading...", show = true }) {
  if (!show) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <LoadingSpinner size="large" />
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonDashboard,
  LoadingSpinner,
  LoadingOverlay,
};
