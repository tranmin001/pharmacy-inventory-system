import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';
import LandingPage from './LandingPage/LandingPage';
import Sidebar from './components/Sidebar';
import StatsBar from './components/StatsBar';
import MedicationTable from './components/MedicationTable';
import PredictionsPanel from './components/PredictionsPanel';
import OrdersPanel from './components/OrdersPanel';
import ShipmentsPanel from './components/ShipmentsPanel';
import ToastContainer from './components/ToastContainer';

const AnalyticsPanel = lazy(() => import('./components/AnalyticsPanel'));

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';
const STRENGTH_REGEX = /\d+\s*(?:mg|ml|mcg|g|ug|%|iu|meq|units?|caps?|tabs?|mg\/ml|mg\/5ml|mcg\/ml)/i;

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [landingExiting, setLandingExiting] = useState(false);
  const [dashboardExiting, setDashboardExiting] = useState(false);
  const [medications, setMedications] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activePanel, setActivePanel] = useState('inventory');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState([]);
  const searchRef = useRef(null);
  const toastIdRef = useRef(0);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    expiration_date: '',
    price: ''
  });
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [shipmentData, setShipmentData] = useState({
    shipment_id: '',
    supplier_name: '',
    date_received: new Date().toISOString().split('T')[0],
    items: [{ medication_name: '', quantity: '', expiration_date: '', price: '' }]
  });
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderSuggestions, setReorderSuggestions] = useState([]);
  const [reorderSelected, setReorderSelected] = useState({});
  const [reorderNotes, setReorderNotes] = useState('');
  const [reorderLoading, setReorderLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('pharmtrack-dark-mode') === 'true');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expirationFrom, setExpirationFrom] = useState('');
  const [expirationTo, setExpirationTo] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [shipmentHistory, setShipmentHistory] = useState([]);

  // --- Toast helpers ---
  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, 4000);
  }, []);

  const setError = useCallback((msg) => { if (msg) addToast(msg, 'error'); }, [addToast]);
  const setSuccess = useCallback((msg) => { if (msg) addToast(msg, 'success'); }, [addToast]);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // --- Data fetching ---
  useEffect(() => {
    fetchMedications();
    fetchPredictions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('pharmtrack-dark-mode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (activePanel === 'orders') fetchOrders();
    if (activePanel === 'shipments') fetchShipmentHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePanel]);

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showLanding || showShipmentModal || showReorderModal) return;
      const tag = e.target.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === 'Escape') {
        if (showForm) {
          setShowForm(false);
          setEditingId(null);
          setFormData({ name: '', quantity: '', expiration_date: '', price: '' });
        }
        setShowExportMenu(false);
        return;
      }

      if (isInput) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setActivePanel('inventory');
        setShowForm(true);
        setEditingId(null);
        setFormData({ name: '', quantity: '', expiration_date: '', price: '' });
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        setActivePanel('inventory');
        searchRef.current?.focus();
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showLanding, showForm, showShipmentModal, showReorderModal]);

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

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      setOrders(response.data);
    } catch (err) {
      console.error('Failed to load orders');
    }
  };

  const fetchShipmentHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/shipments`);
      setShipmentHistory(response.data);
    } catch (err) {
      console.error('Failed to load shipment history');
    }
  };

  // --- Status helpers ---
  const isExpired = (date) => new Date(date) < new Date();
  const isLowStock = (quantity) => quantity < 10;
  const isExpiringSoon = (date) => {
    const expDate = new Date(date);
    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return expDate > today && expDate <= thirtyDays;
  };

  // --- Form validation & handlers ---
  const validateForm = () => {
    if (!formData.name.trim()) { setError('Medication name is required'); return false; }
    if (formData.name.length > 100) { setError('Medication name too long (max 100 characters)'); return false; }
    if (!STRENGTH_REGEX.test(formData.name)) { setError('Medication name must include a strength (e.g. "Amoxicillin 500mg"). Include the dosage/concentration.'); return false; }
    const qty = parseInt(formData.quantity);
    if (isNaN(qty) || qty < 1 || qty > 1000) { setError('Quantity must be between 1 and 1000'); return false; }
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0.01 || price > 10000) { setError('Price must be between $0.01 and $10,000'); return false; }
    if (!formData.expiration_date) { setError('Expiration date is required'); return false; }
    const expDate = new Date(formData.expiration_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expDate <= today && !editingId) { setError('Cannot add expired medication. Expiration date must be in the future.'); return false; }
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5);
    if (expDate > maxDate && !editingId) { setError('Expiration date too far in future (max 5 years). Please verify.'); return false; }
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

  // --- Shipment handlers ---
  const openShipmentModal = async () => {
    try {
      const response = await axios.get(`${API_URL}/shipments/next-id`);
      setShipmentData({
        shipment_id: response.data.shipment_id,
        supplier_name: '',
        date_received: new Date().toISOString().split('T')[0],
        items: [{ medication_name: '', quantity: '', expiration_date: '', price: '' }]
      });
      setShowShipmentModal(true);
      setError('');
    } catch (err) {
      setError('Failed to generate shipment ID');
    }
  };

  const addShipmentItem = () => {
    setShipmentData({
      ...shipmentData,
      items: [...shipmentData.items, { medication_name: '', quantity: '', expiration_date: '', price: '' }]
    });
  };

  const removeShipmentItem = (index) => {
    if (shipmentData.items.length <= 1) return;
    setShipmentData({
      ...shipmentData,
      items: shipmentData.items.filter((_, i) => i !== index)
    });
  };

  const updateShipmentItem = (index, field, value) => {
    const updated = [...shipmentData.items];
    updated[index] = { ...updated[index], [field]: value };
    setShipmentData({ ...shipmentData, items: updated });
  };

  const validateShipment = () => {
    if (!shipmentData.supplier_name.trim()) { setError('Supplier name is required'); return false; }
    if (shipmentData.supplier_name.length > 200) { setError('Supplier name too long (max 200 characters)'); return false; }
    if (!shipmentData.date_received) { setError('Date received is required'); return false; }
    const recvDate = new Date(shipmentData.date_received);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (recvDate > today) { setError('Date received cannot be in the future'); return false; }
    for (let i = 0; i < shipmentData.items.length; i++) {
      const item = shipmentData.items[i];
      if (!item.medication_name.trim()) { setError(`Item ${i + 1}: Medication name is required`); return false; }
      if (!STRENGTH_REGEX.test(item.medication_name)) { setError(`Item ${i + 1}: Medication name must include a strength (e.g. "Amoxicillin 500mg")`); return false; }
      const qty = parseInt(item.quantity);
      if (isNaN(qty) || qty < 1 || qty > 1000) { setError(`Item ${i + 1}: Quantity must be between 1 and 1000`); return false; }
      const price = parseFloat(item.price);
      if (isNaN(price) || price < 0.01 || price > 10000) { setError(`Item ${i + 1}: Price must be between $0.01 and $10,000`); return false; }
      if (!item.expiration_date) { setError(`Item ${i + 1}: Expiration date is required`); return false; }
      if (new Date(item.expiration_date) <= new Date()) { setError(`Item ${i + 1}: Expiration date must be in the future`); return false; }
    }
    return true;
  };

  const handleShipmentSubmit = async () => {
    setError('');
    if (!validateShipment()) return;
    setShipmentLoading(true);
    try {
      const response = await axios.post(`${API_URL}/shipments`, shipmentData);
      const result = response.data;
      const created = result.items.filter(i => i.action === 'created').length;
      const restocked = result.items.filter(i => i.action === 'restocked').length;
      let msg = `Shipment ${result.shipment_id} received - ${result.total_items} units ($${result.total_value.toFixed(2)})`;
      if (restocked > 0) msg += `, ${restocked} restocked`;
      if (created > 0) msg += `, ${created} new`;
      setSuccess(msg);
      setShowShipmentModal(false);
      fetchMedications();
      fetchPredictions();
      if (activePanel === 'shipments') fetchShipmentHistory();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process shipment');
    } finally {
      setShipmentLoading(false);
    }
  };

  // --- Reorder handlers ---
  const openReorderModal = async () => {
    setReorderLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/orders/suggestions`);
      const suggestions = response.data;
      setReorderSuggestions(suggestions);
      const selected = {};
      suggestions.forEach(s => {
        selected[s.medication_id] = { selected: true, order_quantity: s.suggested_quantity };
      });
      setReorderSelected(selected);
      setReorderNotes('');
      setShowReorderModal(true);
    } catch (err) {
      setError('Failed to load reorder suggestions');
    } finally {
      setReorderLoading(false);
    }
  };

  const toggleReorderItem = (medId) => {
    setReorderSelected({
      ...reorderSelected,
      [medId]: { ...reorderSelected[medId], selected: !reorderSelected[medId]?.selected }
    });
  };

  const toggleSelectAll = () => {
    const allSelected = Object.values(reorderSelected).every(v => v.selected);
    const updated = {};
    Object.keys(reorderSelected).forEach(id => {
      updated[id] = { ...reorderSelected[id], selected: !allSelected };
    });
    setReorderSelected(updated);
  };

  const updateOrderQuantity = (medId, qty) => {
    setReorderSelected({
      ...reorderSelected,
      [medId]: { ...reorderSelected[medId], order_quantity: qty }
    });
  };

  const handleReorderSubmit = async () => {
    const selectedItems = reorderSuggestions
      .filter(s => reorderSelected[s.medication_id]?.selected)
      .map(s => ({
        medication_id: s.medication_id,
        medication_name: s.medication_name,
        current_quantity: s.current_quantity,
        order_quantity: parseInt(reorderSelected[s.medication_id]?.order_quantity) || s.suggested_quantity,
        reason: s.reasons.join(', ')
      }));
    if (selectedItems.length === 0) { setError('Select at least one item to reorder'); return; }
    for (let i = 0; i < selectedItems.length; i++) {
      if (selectedItems[i].order_quantity < 1 || selectedItems[i].order_quantity > 1000) {
        setError(`${selectedItems[i].medication_name}: Order quantity must be between 1 and 1000`);
        return;
      }
    }
    setReorderLoading(true);
    try {
      const response = await axios.post(`${API_URL}/orders`, { items: selectedItems, notes: reorderNotes });
      setSuccess(`Reorder ${response.data.order_id} created with ${selectedItems.length} items`);
      setShowReorderModal(false);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create reorder');
    } finally {
      setReorderLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_URL}/orders/${orderId}/status`, { status: newStatus });
      setSuccess(`Order ${orderId} marked as ${newStatus}`);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update order status');
    }
  };

  // --- PDF exports ---
  const exportInventoryPDF = () => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text('PharmTrack - Inventory Report', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${today}`, 14, 30);
    doc.text(`Total Items: ${medications.length}`, 14, 36);
    const getStatus = (med) => {
      const parts = [];
      if (new Date(med.expiration_date) < new Date()) parts.push('Expired');
      else if (isExpiringSoon(med.expiration_date)) parts.push('Expiring Soon');
      if (med.quantity < 10) parts.push('Low Stock');
      return parts.length ? parts.join(', ') : 'OK';
    };
    autoTable(doc, {
      startY: 42,
      head: [['ID', 'Medication', 'Qty', 'Expiration', 'Price', 'Status']],
      body: medications.map(m => [m.id, m.name, m.quantity, m.expiration_date, `$${parseFloat(m.price).toFixed(2)}`, getStatus(m)]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [13, 148, 136], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 251] },
    });
    doc.save('pharmacy-inventory-report.pdf');
    setSuccess('Inventory report exported as PDF');
  };

  const exportReorderPDF = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/suggestions`);
      const suggestions = response.data;
      if (suggestions.length === 0) { setError('No items need reordering - nothing to export'); return; }
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString();
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('PharmTrack - Reorder List', 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${today}`, 14, 30);
      doc.text(`Items to reorder: ${suggestions.length}`, 14, 36);
      autoTable(doc, {
        startY: 42,
        head: [['Medication', 'Current Qty', 'Suggested Order', 'Reason']],
        body: suggestions.map(s => [s.medication_name, s.current_quantity, s.suggested_quantity, s.reasons.join(', ')]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [217, 119, 6], textColor: 255 },
        alternateRowStyles: { fillColor: [255, 251, 235] },
      });
      doc.save('pharmacy-reorder-list.pdf');
      setSuccess('Reorder list exported as PDF');
    } catch (err) {
      setError('Failed to generate reorder PDF');
    }
  };

  const exportShipmentsPDF = async () => {
    try {
      const response = await axios.get(`${API_URL}/shipments`);
      const shipments = response.data;
      if (shipments.length === 0) { setError('No shipment history to export'); return; }
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString();
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('PharmTrack - Shipment History', 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${today}`, 14, 30);
      doc.text(`Total shipments: ${shipments.length}`, 14, 36);
      let yPos = 42;
      shipments.forEach((s) => {
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(`${s.shipment_id} - ${s.supplier_name} (${s.date_received})`, 14, yPos);
        yPos += 6;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Items: ${s.total_items} units | Value: $${parseFloat(s.total_value).toFixed(2)}`, 14, yPos);
        yPos += 4;
        autoTable(doc, {
          startY: yPos,
          head: [['Medication', 'Qty', 'Expiration', 'Price', 'Action']],
          body: s.items.map(i => [i.medication_name, i.quantity, i.expiration_date, `$${parseFloat(i.price).toFixed(2)}`, i.action]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [13, 148, 136], textColor: 255 },
          alternateRowStyles: { fillColor: [248, 250, 251] },
          margin: { left: 14 },
        });
        yPos = doc.lastAutoTable.finalY + 12;
      });
      doc.save('pharmacy-shipment-history.pdf');
      setSuccess('Shipment history exported as PDF');
    } catch (err) {
      setError('Failed to generate shipment PDF');
    }
  };

  // --- Filtering & sorting (memoized) ---
  const clearFilters = () => {
    setStatusFilter('all');
    setExpirationFrom('');
    setExpirationTo('');
    setPriceMin('');
    setPriceMax('');
  };

  const handleStatClick = (filter) => {
    setActivePanel('inventory');
    setStatusFilter(filter);
    setShowFilters(true);
  };

  const hasActiveFilters = statusFilter !== 'all' || expirationFrom || expirationTo || priceMin || priceMax;

  const filteredMedications = useMemo(() => {
    return medications.filter(m => {
      if (searchTerm && !m.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (statusFilter !== 'all') {
        if (statusFilter === 'expired' && !isExpired(m.expiration_date)) return false;
        if (statusFilter === 'expiring' && !isExpiringSoon(m.expiration_date)) return false;
        if (statusFilter === 'low' && !isLowStock(m.quantity)) return false;
        if (statusFilter === 'ok' && (isExpired(m.expiration_date) || isExpiringSoon(m.expiration_date) || isLowStock(m.quantity))) return false;
      }
      if (expirationFrom && m.expiration_date < expirationFrom) return false;
      if (expirationTo && m.expiration_date > expirationTo) return false;
      const price = parseFloat(m.price);
      if (priceMin && price < parseFloat(priceMin)) return false;
      if (priceMax && price > parseFloat(priceMax)) return false;
      return true;
    });
  }, [medications, searchTerm, statusFilter, expirationFrom, expirationTo, priceMin, priceMax]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedMedications = useMemo(() => {
    return [...filteredMedications].sort((a, b) => {
      if (!sortColumn) return 0;
      const dir = sortDirection === 'asc' ? 1 : -1;
      switch (sortColumn) {
        case 'id': return (a.id - b.id) * dir;
        case 'name': return a.name.localeCompare(b.name) * dir;
        case 'quantity': return (a.quantity - b.quantity) * dir;
        case 'expiration': return (new Date(a.expiration_date) - new Date(b.expiration_date)) * dir;
        case 'price': return (parseFloat(a.price) - parseFloat(b.price)) * dir;
        default: return 0;
      }
    });
  }, [filteredMedications, sortColumn, sortDirection]);

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

  // --- Render ---
  if (loading) {
    return (
      <div className="skeleton-wrapper">
        <div className="skeleton-header">
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-subtitle" />
        </div>
        <div className="skeleton-stats">
          {[1,2,3,4].map(i => <div key={i} className="skeleton-stat" />)}
        </div>
        <div className="skeleton-table">
          <div className="skeleton-line skeleton-row-header" />
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton-line skeleton-row" />)}
        </div>
      </div>
    );
  }

  if (showLanding) {
    const handleEnterApp = () => {
      setLandingExiting(true);
      setTimeout(() => {
        setShowLanding(false);
        setLandingExiting(false);
        window.scrollTo(0, 0);
      }, 400);
    };
    return (
      <div className={`lp-transition${landingExiting ? ' lp-transition-exit' : ''}`}>
        <LandingPage onEnterApp={handleEnterApp} />
      </div>
    );
  }

  return (
    <div className={`App${dashboardExiting ? ' app-transition-exit' : ''}`}>
      <header className="header">
        <div className="header-content">
          <div className="header-top">
            <div>
              <h1>PharmTrack</h1>
              <p>Inventory Management System</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-secondary btn-home" onClick={() => {
                setDashboardExiting(true);
                setTimeout(() => {
                  setShowLanding(true);
                  setDashboardExiting(false);
                  window.scrollTo(0, 0);
                }, 400);
              }}>
                Home
              </button>
              <button className="btn btn-secondary btn-dark-toggle" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        <Sidebar activePanel={activePanel} onPanelChange={setActivePanel} />

        <main className="main">
          <StatsBar
            medications={medications}
            isLowStock={isLowStock}
            isExpired={isExpired}
            isExpiringSoon={isExpiringSoon}
            onStatClick={handleStatClick}
          />

          {activePanel === 'inventory' && (
            <>
              <div className="toolbar">
                <div className="toolbar-left">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setShowForm(!showForm);
                      setEditingId(null);
                      setFormData({ name: '', quantity: '', expiration_date: '', price: '' });
                      setError('');
                    }}
                  >
                    {showForm ? 'Cancel' : '+ Add Medication'}
                  </button>
                  <button className="btn btn-secondary" onClick={openShipmentModal}>
                    Receive Shipment
                  </button>
                  <button className="btn btn-secondary" onClick={openReorderModal}>
                    Generate Reorder
                  </button>
                  <div className="export-dropdown-wrapper">
                    <button className="btn btn-secondary" onClick={() => setShowExportMenu(!showExportMenu)}>
                      Export {showExportMenu ? '\u25B4' : '\u25BE'}
                    </button>
                    {showExportMenu && (
                      <div className="export-dropdown">
                        <button className="export-dropdown-item" onClick={() => { exportInventoryPDF(); setShowExportMenu(false); }}>Inventory Report</button>
                        <button className="export-dropdown-item" onClick={() => { exportReorderPDF(); setShowExportMenu(false); }}>Reorder List</button>
                        <button className="export-dropdown-item" onClick={() => { exportShipmentsPDF(); setShowExportMenu(false); }}>Shipment History</button>
                      </div>
                    )}
                  </div>
                </div>
                <input
                  ref={searchRef}
                  type="text"
                  className="search-input"
                  placeholder="Search medications... ( / )"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search medications"
                />
                <button
                  className={`btn btn-secondary${showFilters ? ' btn-filter-active' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Hide Filters' : 'Filters'}{hasActiveFilters ? ' *' : ''}
                </button>
                <div className="inventory-count">
                  {(searchTerm || hasActiveFilters)
                    ? `Showing ${filteredMedications.length} of ${medications.length}`
                    : `${medications.length} item${medications.length !== 1 ? 's' : ''} in inventory`}
                </div>
              </div>

              {showFilters && (
                <div className="filter-panel">
                  <div className="filter-row">
                    <div className="filter-group">
                      <label>Status</label>
                      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">All Statuses</option>
                        <option value="ok">OK</option>
                        <option value="low">Low Stock</option>
                        <option value="expiring">Expiring Soon</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                    <div className="filter-group">
                      <label>Expiration From</label>
                      <input type="date" value={expirationFrom} onChange={(e) => setExpirationFrom(e.target.value)} />
                    </div>
                    <div className="filter-group">
                      <label>Expiration To</label>
                      <input type="date" value={expirationTo} onChange={(e) => setExpirationTo(e.target.value)} />
                    </div>
                    <div className="filter-group">
                      <label>Min Price</label>
                      <input type="number" placeholder="$0" step="0.01" min="0" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
                    </div>
                    <div className="filter-group">
                      <label>Max Price</label>
                      <input type="number" placeholder="$10,000" step="0.01" min="0" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
                    </div>
                    {hasActiveFilters && (
                      <button className="btn btn-secondary btn-sm-action filter-clear" onClick={clearFilters}>Clear</button>
                    )}
                  </div>
                </div>
              )}

              <div className={`slide-panel${showForm ? ' slide-panel-open' : ''}`}>
                <div className="slide-panel-header">
                  <h2>{editingId ? 'Edit Medication' : 'Add New Medication'}</h2>
                  <button className="modal-close" onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ name: '', quantity: '', expiration_date: '', price: '' });
                  }} aria-label="Close form">X</button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Medication Name & Strength *</label>
                    <input type="text" placeholder="e.g., Amoxicillin 500mg" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} maxLength={100} />
                  </div>
                  <div className="form-group">
                    <label>Quantity * (1-1000)</label>
                    <input type="number" placeholder="0" min="1" max="1000" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Price * ($0.01 - $10,000)</label>
                    <input type="number" placeholder="0.00" step="0.01" min="0.01" max="10000" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Expiration Date * (must be within 5 years)</label>
                    <input type="date" min={editingId ? undefined : getMinDate()} max={getMaxDate()} value={formData.expiration_date} onChange={(e) => setFormData({...formData, expiration_date: e.target.value})} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block">
                    {editingId ? 'Update Medication' : 'Add to Inventory'}
                  </button>
                </form>
                <div className="slide-panel-hint">Press Esc to close</div>
              </div>

              <MedicationTable
                medications={sortedMedications}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                isExpired={isExpired}
                isExpiringSoon={isExpiringSoon}
                isLowStock={isLowStock}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </>
          )}

          {activePanel === 'charts' && (
            <Suspense fallback={<div className="loading">Loading analytics...</div>}>
              <AnalyticsPanel medications={medications} />
            </Suspense>
          )}

          {activePanel === 'predictions' && (
            <PredictionsPanel predictions={predictions} />
          )}

          {activePanel === 'orders' && (
            <OrdersPanel orders={orders} onUpdateStatus={handleUpdateOrderStatus} />
          )}

          {activePanel === 'shipments' && (
            <ShipmentsPanel shipments={shipmentHistory} />
          )}

          {showReorderModal && (
            <div className="modal-overlay" onClick={() => setShowReorderModal(false)}>
              <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Generate Reorder">
                <div className="modal-header">
                  <h2>Generate Reorder</h2>
                  <button className="modal-close" onClick={() => setShowReorderModal(false)} aria-label="Close">X</button>
                </div>
                <div className="modal-body">
                  {reorderSuggestions.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No items need reordering right now. All stock levels are healthy.</p>
                  ) : (
                    <>
                      <div className="section-header">
                        <h3>{reorderSuggestions.length} items suggested</h3>
                        <button className="btn btn-secondary btn-sm-action" onClick={toggleSelectAll}>
                          {Object.values(reorderSelected).every(v => v.selected) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="table-container modal-table-container">
                        <table className="reorder-table">
                          <thead>
                            <tr><th></th><th>Medication</th><th>Current Qty</th><th>Order Qty</th><th>Reason</th></tr>
                          </thead>
                          <tbody>
                            {reorderSuggestions.map(s => (
                              <tr key={s.medication_id} className={!reorderSelected[s.medication_id]?.selected ? 'row-deselected' : ''}>
                                <td><input type="checkbox" checked={reorderSelected[s.medication_id]?.selected || false} onChange={() => toggleReorderItem(s.medication_id)} /></td>
                                <td className="name-cell">{s.medication_name}</td>
                                <td>{s.current_quantity}</td>
                                <td><input type="number" className="qty-input" min="1" max="1000" value={reorderSelected[s.medication_id]?.order_quantity || ''} onChange={(e) => updateOrderQuantity(s.medication_id, e.target.value)} disabled={!reorderSelected[s.medication_id]?.selected} /></td>
                                <td>{s.reasons.map((r, i) => (<span key={i} className="badge badge-low" style={{ marginRight: '4px', fontSize: '0.65rem' }}>{r}</span>))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="form-group" style={{ marginTop: '16px' }}>
                        <label>Notes (optional)</label>
                        <input type="text" placeholder="e.g., Urgent restock for flu season" value={reorderNotes} onChange={(e) => setReorderNotes(e.target.value)} />
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowReorderModal(false)}>Cancel</button>
                  {reorderSuggestions.length > 0 && (
                    <button className="btn btn-primary" onClick={handleReorderSubmit} disabled={reorderLoading}>
                      {reorderLoading ? 'Submitting...' : `Create Order (${Object.values(reorderSelected).filter(v => v.selected).length} items)`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {showShipmentModal && (
            <div className="modal-overlay" onClick={() => setShowShipmentModal(false)}>
              <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Receive Shipment">
                <div className="modal-header">
                  <h2>Receive Shipment</h2>
                  <button className="modal-close" onClick={() => setShowShipmentModal(false)} aria-label="Close">X</button>
                </div>
                <div className="modal-body">
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>Shipment ID</label>
                      <input type="text" className="input-disabled" value={shipmentData.shipment_id} disabled />
                    </div>
                    <div className="form-group">
                      <label>Supplier Name *</label>
                      <input type="text" placeholder="e.g., McKesson" value={shipmentData.supplier_name} onChange={(e) => setShipmentData({ ...shipmentData, supplier_name: e.target.value })} maxLength={200} />
                    </div>
                    <div className="form-group">
                      <label>Date Received *</label>
                      <input type="date" value={shipmentData.date_received} max={new Date().toISOString().split('T')[0]} onChange={(e) => setShipmentData({ ...shipmentData, date_received: e.target.value })} />
                    </div>
                  </div>
                  <div className="section-header">
                    <h3>Line Items</h3>
                    <button className="btn btn-secondary btn-sm-action" onClick={addShipmentItem}>+ Add Item</button>
                  </div>
                  <div className="table-container modal-table-container">
                    <table className="modal-table">
                      <thead>
                        <tr><th>Medication Name</th><th>Quantity</th><th>Expiration Date</th><th>Unit Price</th><th></th></tr>
                      </thead>
                      <tbody>
                        {shipmentData.items.map((item, index) => (
                          <tr key={index}>
                            <td><input type="text" placeholder="e.g., Ibuprofen 200mg" value={item.medication_name} onChange={(e) => updateShipmentItem(index, 'medication_name', e.target.value)} maxLength={100} /></td>
                            <td><input type="number" placeholder="Qty" min="1" max="1000" value={item.quantity} onChange={(e) => updateShipmentItem(index, 'quantity', e.target.value)} /></td>
                            <td><input type="date" min={getMinDate()} max={getMaxDate()} value={item.expiration_date} onChange={(e) => updateShipmentItem(index, 'expiration_date', e.target.value)} /></td>
                            <td><input type="number" placeholder="0.00" step="0.01" min="0.01" max="10000" value={item.price} onChange={(e) => updateShipmentItem(index, 'price', e.target.value)} /></td>
                            <td><button className="btn-sm btn-delete" onClick={() => removeShipmentItem(index)} disabled={shipmentData.items.length <= 1}>Remove</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowShipmentModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleShipmentSubmit} disabled={shipmentLoading}>
                    {shipmentLoading ? 'Processing...' : 'Receive Shipment'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="footer">
        <p>PharmTrack v2.0 - Pharmacy inventory and stock management</p>
      </footer>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
