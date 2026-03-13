import React from 'react';

function MedicationTable({
  medications,
  sortColumn,
  sortDirection,
  onSort,
  isExpired,
  isExpiringSoon,
  isLowStock,
  onEdit,
  onDelete
}) {
  const getSortIndicator = (column) => {
    if (sortColumn !== column) return ' \u2195';
    return sortDirection === 'asc' ? ' \u2191' : ' \u2193';
  };

  const getRowUrgencyClass = (med) => {
    if (isExpired(med.expiration_date)) return 'row-urgency-expired';
    if (isLowStock(med.quantity) && isExpiringSoon(med.expiration_date)) return 'row-urgency-expired';
    if (isLowStock(med.quantity)) return 'row-urgency-low';
    if (isExpiringSoon(med.expiration_date)) return 'row-urgency-warning';
    return '';
  };

  const getQuantityPercent = (quantity) => Math.min((quantity / 100) * 100, 100);

  const getQuantityColor = (quantity) => {
    if (quantity < 10) return 'var(--danger)';
    if (quantity < 30) return 'var(--warning)';
    return 'var(--accent)';
  };

  if (medications.length === 0) {
    return (
      <div className="empty-state">
        <p>No medications found</p>
        <span>Try adjusting your filters or add a new medication</span>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="med-table" aria-label="Medication inventory">
        <thead>
          <tr>
            <th className="th-sortable" onClick={() => onSort('id')} aria-sort={sortColumn === 'id' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
              ID{getSortIndicator('id')}
            </th>
            <th className="th-sortable" onClick={() => onSort('name')} aria-sort={sortColumn === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
              Medication{getSortIndicator('name')}
            </th>
            <th className="th-sortable" onClick={() => onSort('quantity')} aria-sort={sortColumn === 'quantity' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
              Quantity{getSortIndicator('quantity')}
            </th>
            <th className="th-sortable" onClick={() => onSort('expiration')} aria-sort={sortColumn === 'expiration' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
              Expiration{getSortIndicator('expiration')}
            </th>
            <th className="th-sortable" onClick={() => onSort('price')} aria-sort={sortColumn === 'price' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
              Price{getSortIndicator('price')}
            </th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {medications.map((med) => (
            <tr key={med.id} className={`${isExpired(med.expiration_date) ? 'row-expired' : ''} ${getRowUrgencyClass(med)}`}>
              <td className="id-cell">#{med.id}</td>
              <td className="name-cell">{med.name}</td>
              <td>
                <div className="qty-cell">
                  <span className={isLowStock(med.quantity) ? 'low-stock' : ''}>{med.quantity}</span>
                  <div className="qty-bar" aria-hidden="true">
                    <div
                      className="qty-bar-fill"
                      style={{
                        width: `${getQuantityPercent(med.quantity)}%`,
                        backgroundColor: getQuantityColor(med.quantity)
                      }}
                    />
                  </div>
                </div>
              </td>
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
                <button className="btn-sm btn-edit" onClick={() => onEdit(med)} aria-label={`Edit ${med.name}`}>Edit</button>
                <button className="btn-sm btn-delete" onClick={() => onDelete(med.id, med.name)} aria-label={`Delete ${med.name}`}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MedicationTable;
