import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function AnalyticsPanel({ medications }) {
  const stockChartData = useMemo(() => {
    return [...medications]
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 15)
      .map(m => ({
        name: m.name.length > 18 ? m.name.substring(0, 16) + '...' : m.name,
        quantity: m.quantity,
        fill: m.quantity < 10 ? '#DC2626' : m.quantity < 30 ? '#D97706' : '#0D9488'
      }));
  }, [medications]);

  const expirationData = useMemo(() => {
    const today = new Date();
    return medications
      .filter(m => new Date(m.expiration_date) > today)
      .sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date))
      .slice(0, 15)
      .map(m => {
        const daysLeft = Math.ceil((new Date(m.expiration_date) - today) / (1000 * 60 * 60 * 24));
        return {
          name: m.name.length > 18 ? m.name.substring(0, 16) + '...' : m.name,
          days: daysLeft,
          fill: daysLeft <= 7 ? '#DC2626' : daysLeft <= 30 ? '#D97706' : daysLeft <= 90 ? '#7c3aed' : '#0D9488'
        };
      });
  }, [medications]);

  const valueChartData = useMemo(() => {
    return [...medications]
      .sort((a, b) => (b.quantity * b.price) - (a.quantity * a.price))
      .slice(0, 15)
      .map(m => ({
        name: m.name.length > 18 ? m.name.substring(0, 16) + '...' : m.name,
        value: parseFloat((m.quantity * m.price).toFixed(2)),
        fill: '#0D9488'
      }));
  }, [medications]);

  if (medications.length === 0) {
    return (
      <div className="empty-state">
        <p>No data to visualize</p>
        <span>Add medications to see analytics</span>
      </div>
    );
  }

  return (
    <div className="predictions-panel">
      <h2>Inventory Analytics</h2>
      <p className="predictions-subtitle">Visual overview of stock levels, expiration timeline, and inventory value</p>
      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">Stock Levels</h3>
          <p className="chart-subtitle">Sorted by quantity (lowest first)</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockChartData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" fontSize={11} tick={{ fill: '#64748B' }} interval={0} />
              <YAxis fontSize={12} tick={{ fill: '#64748B' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }} />
              <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                {stockChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-dot" style={{ background: '#DC2626' }}></span>Critical (&lt;10)</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#D97706' }}></span>Low (&lt;30)</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#0D9488' }}></span>Healthy</span>
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Expiration Timeline</h3>
          <p className="chart-subtitle">Days until expiration (soonest first)</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={expirationData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" fontSize={11} tick={{ fill: '#64748B' }} interval={0} />
              <YAxis fontSize={12} tick={{ fill: '#64748B' }} label={{ value: 'Days', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#94A3B8' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }} formatter={(value) => [`${value} days`, 'Days Left']} />
              <Bar dataKey="days" radius={[4, 4, 0, 0]}>
                {expirationData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-dot" style={{ background: '#DC2626' }}></span>This week</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#D97706' }}></span>This month</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#7c3aed' }}></span>3 months</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#0D9488' }}></span>Later</span>
          </div>
        </div>

        <div className="chart-card chart-card-full">
          <h3 className="chart-title">Inventory Value</h3>
          <p className="chart-subtitle">Total value per medication (quantity x price)</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={valueChartData} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" fontSize={11} tick={{ fill: '#64748B' }} interval={0} />
              <YAxis fontSize={12} tick={{ fill: '#64748B' }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem' }} formatter={(value) => [`$${value.toFixed(2)}`, 'Value']} />
              <Bar dataKey="value" fill="#0D9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPanel;
