import React from "react";

const Modal = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
      <div className="card" style={{ width: 520, maxWidth: '95vw' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
        {footer && <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;



