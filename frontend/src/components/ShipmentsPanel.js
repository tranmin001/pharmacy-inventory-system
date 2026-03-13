import React from 'react';

function ShipmentsPanel({ shipments }) {
  return (
    <div className="predictions-panel">
      <h2>Shipment History</h2>
      <p className="predictions-subtitle">Record of all received shipments and their line items</p>
      {shipments.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No shipments received yet. Use "Receive Shipment" to log one.</p>
      ) : (
        <div className="orders-list">
          {shipments.map(shipment => (
            <div key={shipment.shipment_id} className="order-card">
              <div className="order-header">
                <div>
                  <strong>{shipment.shipment_id}</strong>
                  <span className="order-date">{shipment.supplier_name}</span>
                </div>
                <div className="order-header-right">
                  <span className="badge badge-ok">{shipment.date_received}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {shipment.total_items} units - ${parseFloat(shipment.total_value).toFixed(2)}
                  </span>
                </div>
              </div>
              <table className="modal-table">
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Qty</th>
                    <th>Expiration</th>
                    <th>Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shipment.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.medication_name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.expiration_date}</td>
                      <td>${parseFloat(item.price).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${item.action === 'created' ? 'badge-ok' : 'badge-low'}`}>
                          {item.action}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ShipmentsPanel;
