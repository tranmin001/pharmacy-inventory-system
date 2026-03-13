import React from 'react';

const getRiskColor = (risk) => {
  switch(risk) {
    case 'CRITICAL': return '#DC2626';
    case 'HIGH': return '#D97706';
    case 'MEDIUM': return '#7c3aed';
    default: return '#0D9488';
  }
};

function PredictionsPanel({ predictions }) {
  if (predictions.length === 0) {
    return (
      <div className="empty-state">
        <p>No predictions available</p>
        <span>Add medications to generate AI predictions</span>
      </div>
    );
  }

  return (
    <div className="predictions-panel">
      <h2>AI-Powered Inventory Predictions</h2>
      <p className="predictions-subtitle">Using machine learning to predict stockouts based on usage patterns</p>
      <div className="predictions-grid">
        {predictions.map((pred) => (
          <div key={pred.medication_id} className="prediction-card">
            <div className="prediction-header">
              <h3>{pred.medication_name}</h3>
              <span
                className="risk-badge"
                style={{ backgroundColor: getRiskColor(pred.risk_level) }}
              >
                {pred.risk_level}
              </span>
            </div>
            <div className="prediction-body">
              <div className="prediction-stat">
                <span className="stat-label">Current Stock</span>
                <span className="stat-value">{pred.current_quantity} units</span>
              </div>
              <div className="prediction-stat">
                <span className="stat-label">Avg Daily Usage</span>
                <span className="stat-value">{pred.avg_daily_usage} units/day</span>
              </div>
              <div className="prediction-stat">
                <span className="stat-label">Days Until Stockout</span>
                <span className="stat-value" style={{ color: getRiskColor(pred.risk_level) }}>
                  {pred.days_until_stockout} days
                </span>
              </div>
              <div className="prediction-stat">
                <span className="stat-label">Predicted Stockout</span>
                <span className="stat-value">{pred.predicted_stockout_date}</span>
              </div>
              <div className="prediction-stat highlight">
                <span className="stat-label">Reorder By</span>
                <span className="stat-value">{pred.recommended_reorder_date}</span>
              </div>
              <div className="prediction-stat highlight">
                <span className="stat-label">Recommended Order</span>
                <span className="stat-value">{pred.recommended_order_quantity} units</span>
              </div>
              {pred.expires_before_stockout && (
                <div className="prediction-stat" style={{ background: 'var(--danger-light)', margin: '0 -16px', padding: '10px 16px', borderRadius: '0 0 var(--radius) var(--radius)', marginBottom: '-16px' }}>
                  <span className="stat-label" style={{ color: 'var(--danger)', fontWeight: 600 }}>Expires before stockout</span>
                  <span className="stat-value" style={{ color: 'var(--danger)' }}>Replacement needed</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PredictionsPanel;
