import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://127.0.0.1:5000/api';

function App() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    expiration_date: '',
    price: ''
  });

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const response = await axios.get(`${API_URL}/medications`);
      setMedications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching medications:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/medications/${editingId}`, formData);
      } else {
        await axios.post(`${API_URL}/medications`, formData);
      }
      setFormData({ name: '', quantity: '', expiration_date: '', price: '' });
      setShowForm(false);
      setEditingId(null);
      fetchMedications();
    } catch (error) {
      console.error('Error saving medication:', error);
    }
  };

  const handleEdit = (med) => {
    setFormData({
      name: med.name,
      quantity: med.quantity,
      expiration_date: med.expiration_date,
      price: med.price
    });
    setEditingId(med.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      try {
        await axios.delete(`${API_URL}/medications/${id}`);
        fetchMedications();
      } catch (error) {
        console.error('Error deleting medication:', error);
      }
    }
  };

  const isExpired = (date) => {
    return new Date(date) < new Date();
  };

  const isLowStock = (quantity) => {
    return quantity < 10;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>💊 Pharmacy Inventory Management System</h1>
        <p>Real-time inventory tracking for Safeway Pharmacy workflow</p>
      </header>

      <div className="container">
        <div className="actions">
          <button 
            className="btn-primary" 
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ name: '', quantity: '', expiration_date: '', price: '' });
            }}
          >
            {showForm ? 'Cancel' : '+ Add Medication'}
          </button>
        </div>

        {showForm && (
          <div className="form-container">
            <h2>{editingId ? 'Edit Medication' : 'Add New Medication'}</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Medication Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
              <input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
              />
              <input
                type="date"
                placeholder="Expiration Date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                required
              />
              <button type="submit" className="btn-primary">
                {editingId ? 'Update' : 'Add'} Medication
              </button>
            </form>
          </div>
        )}

        <div className="stats">
          <div className="stat-card">
            <h3>{medications.length}</h3>
            <p>Total Medications</p>
          </div>
          <div className="stat-card low-stock">
            <h3>{medications.filter(m => isLowStock(m.quantity)).length}</h3>
            <p>Low Stock</p>
          </div>
          <div className="stat-card expired">
            <h3>{medications.filter(m => isExpired(m.expiration_date)).length}</h3>
            <p>Expired</p>
          </div>
        </div>

        <div className="medications-grid">
          {medications.map((med) => (
            <div key={med.id} className="med-card">
              <div className="med-header">
                <h3>{med.name}</h3>
                <div className="med-badges">
                  {isLowStock(med.quantity) && <span className="badge low-stock">Low Stock</span>}
                  {isExpired(med.expiration_date) && <span className="badge expired">Expired</span>}
                </div>
              </div>
              <div className="med-details">
                <p><strong>Quantity:</strong> {med.quantity}</p>
                <p><strong>Expires:</strong> {med.expiration_date}</p>
                <p><strong>Price:</strong> ${parseFloat(med.price).toFixed(2)}</p>
              </div>
              <div className="med-actions">
                <button className="btn-edit" onClick={() => handleEdit(med)}>Edit</button>
                <button className="btn-delete" onClick={() => handleDelete(med.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        {medications.length === 0 && (
          <div className="empty-state">
            <p>No medications in inventory. Add one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
