import React from 'react';

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container" aria-live="polite" aria-label="Notifications">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}${toast.exiting ? ' toast-exit' : ''}`} role="alert">
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">X</button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
