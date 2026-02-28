import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://127.0.0.1:5000/api';

function App() {
  const [medications, setMedications] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    expiration_date: '',
    price: ''
  });

  useEffect(() => {
    fetchMedications();
    fetchPredictions();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchMedications = async () => {
    try {
      const response = await axios.get(`${API_URL}/medications`);
      setMedications(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load medications. Is the server running?');
      setLoading(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      const response = await axios.get(`${API_URL}/predictions`);
      setPredictions(response.data);
    } catch (err) {
      console.error('Failed to load predictions');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Medication name is required');
      return false;
    }
    if (formData.name.length > 100) {
      setError('Medication name too long (max 100 characters)');
      return false;
    }
    const qty = parseInt(formData.quantity);
    if (isNaN(qty) || qty < 1 || qty > 1000) {
      setError('Quantity must be between 1 and 1000');
      return false;
    }
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0.01 || price > 10000) {
      setError('Price must be between $0.01 and $10,000');
      return false;
    }
    if (!formData.expiration_date) {
      setError('Expiration date is required');
      return false;
    }
    const expDate = new Date(formData.expiration_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expDate <= today && !editingId) {
      setError('Cannot add expired medication. Expiration date must be in the future.');
      return false;
    }
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    if (expDate > maxDate && !editingId) {
      setError('Expiration date too far in future (max 5 years). Please verify.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    try {
      if (editingId) {
        await axios.put(`${API_URL}/medications/${editingId}`, formData);
        setSuccess('Medication updated successfully!');
      } else {
        await axios.post(`${API_URL}/medications`, formData);
        setSuccess('Medication added successfully!');
      }
      setFormData({ name: '', quantity: '', expiration_date: '', price: '' });
      setShowForm(false);
      setEditingId(null);
      fetchMedications();
      fetchPredictions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save medication');
    }
  };

  const handleEdit = (med) => {
    setFormData({
      name: med.name,
      quantity: med.quantity.toString(),
      expiration_date: med.expiration_date,
      price: med.price.toString()
    });
    setEditingId(med.id);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await axios.delete(`${API_URL}/medications/${id}`);
        setSuccess(`${name} deleted successfully`);
        fetchMedications();
        fetchPredictions();
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete medication');
      }
    }
  };

  const isExpired = (date) => new Date(date) < new Date();
  const isLowStock = (quantity) => quantity < 10;
  const isExpiringSoon = (date) => {
    const expDate = new Date(date);
    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return expDate > today && expDate <= thirtyDays;
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    return maxDate.toISOString().split('T')[0];
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#f59e0b';
      case 'MEDIUM': return '#8b5cf6';
      default: return '#10b981';
    }
  };

  if (loading) {
    return <div className="loading">Loading inventory...</div>;
  }

  return (
    <div className="App">
      <header className="header">
        <div className="header-content">
          <h1>PharmTrack</h1>
          <p>Inventory Management System</p>
        </div>
      </header>

      <main className="main">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="toolbar">
          <div className="toolbar-left">
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setShowForm(!showForm);
                setShowPredictions(false);
                setEditingId(null);
                setFormData({ name: '', quantity: '', expiration_date: '', price: '' });
                setError('');
              }}
            >
              {showForm ? 'Cancel' : '+ Add Medication'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setShowPredictions(!showPredictions);
                setShowForm(false);
              }}
            >
              {showPredictions ? 'Hide Predictions' : 'View AI Predictions'}
            </button>
          </div>
          <div className="inventory-count">
            {medications.length} item{medications.length !== 1 ? 's' : ''} in inventory
          </div>
        </div>

        {showForm && (
          <div className="form-card">
            <h2>{editingId ? 'Edit Medication' : 'Add New Medication'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Medication Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Amoxicillin 500mg"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  maxLength={100}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity * (1-1000)</label>
                  <input
                    type="number"
                    placeholder="0"
                    min="1"
                    max="1000"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Price * ($0.01 - $10,000)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    max="10000"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Expiration Date * (must be within 5 years)</label>
                <input
                  type="date"
                  min={editingId ? undefined : getMinDate()}
                  max={getMaxDate()}
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                {editingId ? 'Update Medication' : 'Add to Inventory'}
              </button>
            </form>
          </div>
        )}

        {showPredictions && (
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="stats-bar">
          <div className="stat">
            <span className="stat-value">{medications.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat stat-warning">
            <span className="stat-value">{medications.filter(m => isLowStock(m.quantity)).length}</span>
            <span className="stat-label">Low Stock</span>
          </div>
          <div className="stat stat-danger">
            <span className="stat-value">{medications.filter(m => isExpired(m.expiration_date)).length}</span>
            <span className="stat-label">Expired</span>
          </div>
          <div className="stat stat-alert">
            <span className="stat-value">{medications.filter(m => isExpiringSoon(m.expiration_date)).length}</span>
            <span className="stat-label">Expiring Soon</span>
          </div>
        </div>

        {medications.length === 0 ? (
          <div className="empty-state">
            <p>No medications in inventory</p>
            <span>Click "Add Medication" to get started</span>
          </div>
        ) : (
          <div className="table-container">
            <table className="med-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Medication</th>
                  <th>Quantity</th>
                  <th>Expiration</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((med) => (
                  <tr key={med.id} className={isExpired(med.expiration_date) ? 'row-expired' : ''}>
                    <td className="id-cell">#{med.id}</td>
                    <td className="name-cell">{med.name}</td>
                    <td className={isLowStock(med.quantity) ? 'low-stock' : ''}>{med.quantity}</td>
                    <td>{med.expiration_date}</td>
                    <td>${parseFloat(med.price).toFixed(2)}</td>
                    <td className="status-cell">
                      {isExpired(med.expiration_date) && <span className="badge badge-expired">Expired</span>}
                      {isExpiringSoon(med.expiration_date) && <span className="badge badge-warning">Expiring Soon</span>}
                      {isLowStock(med.quantity) && <span className="badge badge-low">Low Stock</span>}
                      {!isExpired(med.expiration_date) && !isExpiringSoon(med.expiration_date) && !isLowStock(med.quantity) && 
                        <span className="badge badge-ok">OK</span>}
                    </td>
                    <td className="actions-cell">
                      <button className="btn-sm btn-edit" onClick={() => handleEdit(med)}>Edit</button>
                      <button className="btn-sm btn-delete" onClick={() => handleDelete(med.id, med.name)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>PharmTrack v1.0 — Built for Safeway Pharmacy workflow optimization</p>
      </footer>
    </div>
  );
}

export default App;