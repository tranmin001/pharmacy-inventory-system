import React from 'react';

function StatsBar({ medications, isLowStock, isExpired, isExpiringSoon, onStatClick }) {
  return (
    <div className="stats-bar" role="group" aria-label="Inventory statistics">
      <button className="stat" onClick={() => onStatClick('all')}>
        <span className="stat-value">{medications.length}</span>
        <span className="stat-label">Total</span>
      </button>
      <button className="stat stat-warning" onClick={() => onStatClick('low')}>
        <span className="stat-value">{medications.filter(m => isLowStock(m.quantity)).length}</span>
        <span className="stat-label">Low Stock</span>
      </button>
      <button className="stat stat-danger" onClick={() => onStatClick('expired')}>
        <span className="stat-value">{medications.filter(m => isExpired(m.expiration_date)).length}</span>
        <span className="stat-label">Expired</span>
      </button>
      <button className="stat stat-alert" onClick={() => onStatClick('expiring')}>
        <span className="stat-value">{medications.filter(m => isExpiringSoon(m.expiration_date)).length}</span>
        <span className="stat-label">Expiring Soon</span>
      </button>
    </div>
  );
}

export default StatsBar;
