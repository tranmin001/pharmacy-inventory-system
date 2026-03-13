import React from 'react';

function OrdersPanel({ orders, onUpdateStatus }) {
  return (
    <div className="predictions-panel">
      <h2>Order History</h2>
      <p className="predictions-subtitle">Track reorder status from pending to received</p>
      {orders.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No orders yet. Use "Generate Reorder" to create one.</p>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.order_id} className="order-card">
              <div className="order-header">
                <div>
                  <strong>{order.order_id}</strong>
                  <span className="order-date">{order.created_at}</span>
                </div>
                <div className="order-header-right">
                  <span className={`badge badge-order-${order.status}`}>{order.status}</span>
                  {order.status === 'pending' && (
                    <button className="btn-sm btn-edit" onClick={() => onUpdateStatus(order.order_id, 'submitted')}>Mark Submitted</button>
                  )}
                  {order.status === 'submitted' && (
                    <button className="btn-sm btn-edit" onClick={() => onUpdateStatus(order.order_id, 'received')}>Mark Received</button>
                  )}
                </div>
              </div>
              {order.notes && <div className="order-notes">{order.notes}</div>}
              <table className="modal-table">
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Current Qty</th>
                    <th>Order Qty</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.medication_name}</td>
                      <td>{item.current_quantity}</td>
                      <td><strong>{item.order_quantity}</strong></td>
                      <td>
                        {item.reason.split(', ').map((r, j) => (
                          <span key={j} className="badge badge-low" style={{ marginRight: '4px', fontSize: '0.65rem' }}>{r}</span>
                        ))}
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

export default OrdersPanel;
