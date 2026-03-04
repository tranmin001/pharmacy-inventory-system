from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
import re
from datetime import datetime, timedelta
from predictor import InventoryPredictor

STRENGTH_PATTERN = re.compile(
    r'\d+\s*(?:mg|ml|mcg|g|ug|%|iu|meq|units?|caps?|tabs?|mg/ml|mg/5ml|mcg/ml)',
    re.IGNORECASE
)

def validate_medication_name(name):
    """Require both a drug name and a strength (e.g. 'Amoxicillin 500mg')."""
    stripped = name.strip()
    if not stripped:
        return False, 'Medication name cannot be empty'
    if len(stripped) > 100:
        return False, 'Medication name too long (max 100 characters)'
    if not STRENGTH_PATTERN.search(stripped):
        return False, 'Medication name must include a strength (e.g. "Amoxicillin 500mg"). Include the dosage/concentration.'
    return True, None

app = Flask(__name__)
CORS(app)

DB_PATH = os.environ.get('DB_PATH', os.path.join(os.path.dirname(__file__), 'pharmacy_inventory.db'))

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''CREATE TABLE IF NOT EXISTS medications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        expiration_date TEXT NOT NULL,
        price REAL NOT NULL
    )''')
    conn.execute('''CREATE TABLE IF NOT EXISTS shipments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shipment_id TEXT NOT NULL UNIQUE,
        supplier_name TEXT NOT NULL,
        date_received TEXT NOT NULL,
        total_items INTEGER NOT NULL DEFAULT 0,
        total_value REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )''')
    conn.execute('''CREATE TABLE IF NOT EXISTS shipment_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shipment_id TEXT NOT NULL,
        medication_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        expiration_date TEXT NOT NULL,
        price REAL NOT NULL,
        medication_id INTEGER,
        action TEXT NOT NULL DEFAULT 'created',
        FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id)
    )''')
    conn.execute('''CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending',
        total_items INTEGER NOT NULL DEFAULT 0,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )''')
    conn.execute('''CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        medication_id INTEGER,
        medication_name TEXT NOT NULL,
        current_quantity INTEGER NOT NULL,
        order_quantity INTEGER NOT NULL,
        reason TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id)
    )''')
    # Seed sample medications if the table is empty
    count = conn.execute('SELECT COUNT(*) FROM medications').fetchone()[0]
    if count == 0:
        sample_meds = [
            ('Amoxicillin 500mg', 150, '2027-03-15', 12.99),
            ('Lisinopril 10mg', 85, '2027-06-20', 8.50),
            ('Metformin 850mg', 200, '2027-09-10', 6.75),
            ('Omeprazole 20mg', 45, '2026-12-01', 15.25),
            ('Atorvastatin 40mg', 120, '2027-08-05', 22.00),
            ('Amlodipine 5mg', 30, '2027-01-18', 9.99),
            ('Metoprolol 50mg', 95, '2027-04-22', 11.50),
            ('Levothyroxine 75mcg', 60, '2027-07-30', 14.00),
            ('Albuterol 90mcg', 15, '2026-08-12', 35.99),
            ('Prednisone 10mg', 5, '2026-05-01', 4.25),
            ('Gabapentin 300mg', 180, '2027-11-15', 10.50),
            ('Hydrochlorothiazide 25mg', 70, '2027-02-28', 7.25),
        ]
        conn.executemany(
            'INSERT INTO medications (name, quantity, expiration_date, price) VALUES (?, ?, ?, ?)',
            sample_meds
        )

    conn.commit()
    conn.close()

init_db()

def generate_shipment_id():
    today = datetime.now().strftime('%Y%m%d')
    conn = get_db_connection()
    result = conn.execute(
        "SELECT COUNT(*) FROM shipments WHERE shipment_id LIKE ?",
        (f'SHP-{today}-%',)
    ).fetchone()[0]
    conn.close()
    return f'SHP-{today}-{result + 1:03d}'

def generate_order_id():
    today = datetime.now().strftime('%Y%m%d')
    conn = get_db_connection()
    result = conn.execute(
        "SELECT COUNT(*) FROM orders WHERE order_id LIKE ?",
        (f'ORD-{today}-%',)
    ).fetchone()[0]
    conn.close()
    return f'ORD-{today}-{result + 1:03d}'

@app.route('/api/medications', methods=['GET'])
def get_medications():
    try:
        conn = get_db_connection()
        medications = conn.execute('SELECT * FROM medications').fetchall()
        conn.close()
        return jsonify([dict(med) for med in medications]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/medications/<int:med_id>', methods=['GET'])
def get_medication(med_id):
    try:
        conn = get_db_connection()
        medication = conn.execute('SELECT * FROM medications WHERE id = ?', (med_id,)).fetchone()
        conn.close()
        if medication is None:
            return jsonify({'error': 'Medication not found'}), 404
        return jsonify(dict(medication)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/medications', methods=['POST'])
def add_medication():
    try:
        data = request.get_json()
        required_fields = ['name', 'quantity', 'expiration_date', 'price']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        valid, err_msg = validate_medication_name(data['name'])
        if not valid:
            return jsonify({'error': err_msg}), 400
        try:
            quantity = int(data['quantity'])
            if quantity < 1 or quantity > 1000:
                return jsonify({'error': 'Quantity must be between 1 and 1000'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid quantity'}), 400
        try:
            price = float(data['price'])
            if price < 0.01 or price > 10000:
                return jsonify({'error': 'Price must be between $0.01 and $10,000'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid price'}), 400
        try:
            exp_date = datetime.strptime(data['expiration_date'], '%Y-%m-%d')
            today = datetime.now()
            max_date = today + timedelta(days=5*365)
            if exp_date.date() <= today.date():
                return jsonify({'error': 'Cannot add expired medication. Expiration date must be in the future.'}), 400
            if exp_date > max_date:
                return jsonify({'error': 'Expiration date too far in future (max 5 years). Please verify the date.'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        conn = get_db_connection()
        cursor = conn.cursor()
        max_id = cursor.execute('SELECT MAX(id) FROM medications').fetchone()[0]
        next_id = (max_id or 0) + 1
        cursor.execute('INSERT INTO medications (id, name, quantity, expiration_date, price) VALUES (?, ?, ?, ?, ?)',
                      (next_id, data['name'].strip(), quantity, data['expiration_date'], price))
        conn.commit()
        conn.close()
        return jsonify({'id': next_id, 'message': 'Medication added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/medications/<int:med_id>', methods=['PUT'])
def update_medication(med_id):
    try:
        data = request.get_json()
        valid, err_msg = validate_medication_name(data.get('name', ''))
        if not valid:
            return jsonify({'error': err_msg}), 400
        try:
            quantity = int(data['quantity'])
            if quantity < 0 or quantity > 1000:
                return jsonify({'error': 'Quantity must be between 0 and 1000'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid quantity'}), 400
        try:
            price = float(data['price'])
            if price < 0.01 or price > 10000:
                return jsonify({'error': 'Price must be between $0.01 and $10,000'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid price'}), 400
        conn = get_db_connection()
        cursor = conn.cursor()
        existing = cursor.execute('SELECT * FROM medications WHERE id = ?', (med_id,)).fetchone()
        if existing is None:
            conn.close()
            return jsonify({'error': 'Medication not found'}), 404
        cursor.execute('UPDATE medications SET name = ?, quantity = ?, expiration_date = ?, price = ? WHERE id = ?',
                      (data.get('name').strip(), quantity, data.get('expiration_date'), price, med_id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Medication updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/medications/<int:med_id>', methods=['DELETE'])
def delete_medication(med_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM medications WHERE id = ?', (med_id,))
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Medication not found'}), 404
        conn.commit()
        conn.close()
        return jsonify({'message': 'Medication deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/medications/low-stock', methods=['GET'])
def get_low_stock():
    try:
        conn = get_db_connection()
        medications = conn.execute('SELECT * FROM medications WHERE quantity < 10').fetchall()
        conn.close()
        return jsonify([dict(med) for med in medications]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/medications/expired', methods=['GET'])
def get_expired():
    try:
        today = datetime.now().date().isoformat()
        conn = get_db_connection()
        medications = conn.execute('SELECT * FROM medications WHERE expiration_date < ?', (today,)).fetchall()
        conn.close()
        return jsonify([dict(med) for med in medications]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predictions', methods=['GET'])
def get_predictions():
    try:
        conn = get_db_connection()
        medications = conn.execute('SELECT * FROM medications').fetchall()
        conn.close()
        meds_list = [dict(med) for med in medications]
        predictor = InventoryPredictor()
        predictions = predictor.get_all_predictions(meds_list)
        return jsonify(predictions), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predictions/<int:med_id>', methods=['GET'])
def get_single_prediction(med_id):
    try:
        conn = get_db_connection()
        medication = conn.execute('SELECT * FROM medications WHERE id = ?', (med_id,)).fetchone()
        conn.close()
        if medication is None:
            return jsonify({'error': 'Medication not found'}), 404
        med = dict(medication)
        predictor = InventoryPredictor()
        prediction = predictor.predict_stockout(med['id'], med['quantity'], med['name'])
        return jsonify(prediction), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shipments/next-id', methods=['GET'])
def get_next_shipment_id():
    try:
        return jsonify({'shipment_id': generate_shipment_id()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shipments', methods=['POST'])
def create_shipment():
    try:
        data = request.get_json()
        if not data.get('supplier_name', '').strip():
            return jsonify({'error': 'Supplier name is required'}), 400
        if len(data['supplier_name']) > 200:
            return jsonify({'error': 'Supplier name too long (max 200 characters)'}), 400
        if not data.get('date_received'):
            return jsonify({'error': 'Date received is required'}), 400
        try:
            recv_date = datetime.strptime(data['date_received'], '%Y-%m-%d')
            if recv_date.date() > datetime.now().date():
                return jsonify({'error': 'Date received cannot be in the future'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        items = data.get('items', [])
        if len(items) < 1:
            return jsonify({'error': 'Shipment must contain at least one item'}), 400
        for i, item in enumerate(items):
            valid, err_msg = validate_medication_name(item.get('medication_name', ''))
            if not valid:
                return jsonify({'error': f'Item {i+1}: {err_msg}'}), 400
            try:
                qty = int(item['quantity'])
                if qty < 1 or qty > 1000:
                    return jsonify({'error': f'Item {i+1}: Quantity must be between 1 and 1000'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': f'Item {i+1}: Invalid quantity'}), 400
            try:
                price = float(item['price'])
                if price < 0.01 or price > 10000:
                    return jsonify({'error': f'Item {i+1}: Price must be between $0.01 and $10,000'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': f'Item {i+1}: Invalid price'}), 400
            try:
                exp_date = datetime.strptime(item['expiration_date'], '%Y-%m-%d')
                if exp_date.date() <= datetime.now().date():
                    return jsonify({'error': f'Item {i+1}: Expiration date must be in the future'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': f'Item {i+1}: Invalid expiration date'}), 400

        shipment_id = generate_shipment_id()
        conn = get_db_connection()
        cursor = conn.cursor()
        total_items = 0
        total_value = 0.0
        line_items = []

        for item in items:
            qty = int(item['quantity'])
            price = float(item['price'])
            med_name = item['medication_name'].strip()
            exp_date = item['expiration_date']
            existing = cursor.execute(
                'SELECT * FROM medications WHERE LOWER(name) = LOWER(?)', (med_name,)
            ).fetchone()
            if existing:
                new_qty = min(existing['quantity'] + qty, 1000)
                cursor.execute(
                    'UPDATE medications SET quantity = ?, price = ? WHERE id = ?',
                    (new_qty, price, existing['id'])
                )
                line_items.append({
                    'medication_name': med_name,
                    'quantity': qty,
                    'expiration_date': exp_date,
                    'price': price,
                    'medication_id': existing['id'],
                    'action': 'restocked'
                })
            else:
                max_id = cursor.execute('SELECT MAX(id) FROM medications').fetchone()[0]
                next_id = (max_id or 0) + 1
                cursor.execute(
                    'INSERT INTO medications (id, name, quantity, expiration_date, price) VALUES (?, ?, ?, ?, ?)',
                    (next_id, med_name, qty, exp_date, price)
                )
                line_items.append({
                    'medication_name': med_name,
                    'quantity': qty,
                    'expiration_date': exp_date,
                    'price': price,
                    'medication_id': next_id,
                    'action': 'created'
                })
            total_items += qty
            total_value += qty * price

        cursor.execute(
            'INSERT INTO shipments (shipment_id, supplier_name, date_received, total_items, total_value) VALUES (?, ?, ?, ?, ?)',
            (shipment_id, data['supplier_name'].strip(), data['date_received'], total_items, round(total_value, 2))
        )
        for li in line_items:
            cursor.execute(
                'INSERT INTO shipment_items (shipment_id, medication_name, quantity, expiration_date, price, medication_id, action) VALUES (?, ?, ?, ?, ?, ?, ?)',
                (shipment_id, li['medication_name'], li['quantity'], li['expiration_date'], li['price'], li['medication_id'], li['action'])
            )
        conn.commit()
        conn.close()
        return jsonify({
            'message': 'Shipment received successfully',
            'shipment_id': shipment_id,
            'total_items': total_items,
            'total_value': round(total_value, 2),
            'items': line_items
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shipments', methods=['GET'])
def get_shipments():
    try:
        conn = get_db_connection()
        shipments = conn.execute('SELECT * FROM shipments ORDER BY created_at DESC').fetchall()
        result = []
        for s in shipments:
            shipment = dict(s)
            items = conn.execute(
                'SELECT * FROM shipment_items WHERE shipment_id = ?', (s['shipment_id'],)
            ).fetchall()
            shipment['items'] = [dict(item) for item in items]
            result.append(shipment)
        conn.close()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/suggestions', methods=['GET'])
def get_order_suggestions():
    try:
        conn = get_db_connection()
        medications = conn.execute('SELECT * FROM medications').fetchall()
        conn.close()
        meds_list = [dict(med) for med in medications]
        predictor = InventoryPredictor()
        predictions = predictor.get_all_predictions(meds_list)
        pred_map = {p['medication_id']: p for p in predictions}

        today = datetime.now().date()
        thirty_days = today + timedelta(days=30)
        suggestions = []
        for med in meds_list:
            reasons = []
            if med['quantity'] < 10:
                reasons.append('Low Stock')
            try:
                exp_date = datetime.strptime(med['expiration_date'], '%Y-%m-%d').date()
                if exp_date <= thirty_days and exp_date > today:
                    reasons.append('Expiring Soon')
            except ValueError:
                pass
            pred = pred_map.get(med['id'])
            if pred and pred.get('risk_level') in ('CRITICAL', 'HIGH'):
                reasons.append(f"ML: {pred['risk_level']}")
            if reasons:
                order_qty = pred['recommended_order_quantity'] if pred else (50 if med['quantity'] < 5 else 30)
                suggestions.append({
                    'medication_id': med['id'],
                    'medication_name': med['name'],
                    'current_quantity': med['quantity'],
                    'suggested_quantity': order_qty,
                    'reasons': reasons,
                    'risk_level': pred['risk_level'] if pred else 'MEDIUM'
                })
        return jsonify(suggestions), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        data = request.get_json()
        items = data.get('items', [])
        if len(items) < 1:
            return jsonify({'error': 'Order must contain at least one item'}), 400
        for i, item in enumerate(items):
            if not item.get('medication_name', '').strip():
                return jsonify({'error': f'Item {i+1}: Medication name is required'}), 400
            try:
                qty = int(item['order_quantity'])
                if qty < 1 or qty > 1000:
                    return jsonify({'error': f'Item {i+1}: Order quantity must be between 1 and 1000'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': f'Item {i+1}: Invalid order quantity'}), 400

        order_id = generate_order_id()
        notes = data.get('notes', '').strip()
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO orders (order_id, status, total_items, notes) VALUES (?, ?, ?, ?)',
            (order_id, 'pending', len(items), notes)
        )
        for item in items:
            cursor.execute(
                'INSERT INTO order_items (order_id, medication_id, medication_name, current_quantity, order_quantity, reason) VALUES (?, ?, ?, ?, ?, ?)',
                (order_id, item.get('medication_id'), item['medication_name'], int(item.get('current_quantity', 0)), int(item['order_quantity']), item.get('reason', ''))
            )
        conn.commit()
        conn.close()
        return jsonify({'message': 'Order created successfully', 'order_id': order_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders', methods=['GET'])
def get_orders():
    try:
        conn = get_db_connection()
        orders = conn.execute('SELECT * FROM orders ORDER BY created_at DESC').fetchall()
        result = []
        for o in orders:
            order = dict(o)
            items = conn.execute(
                'SELECT * FROM order_items WHERE order_id = ?', (o['order_id'],)
            ).fetchall()
            order['items'] = [dict(item) for item in items]
            result.append(order)
        conn.close()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<order_id>/status', methods=['PUT'])
def update_order_status(order_id):
    try:
        data = request.get_json()
        new_status = data.get('status')
        valid_transitions = {
            'pending': 'submitted',
            'submitted': 'received'
        }
        conn = get_db_connection()
        order = conn.execute('SELECT * FROM orders WHERE order_id = ?', (order_id,)).fetchone()
        if not order:
            conn.close()
            return jsonify({'error': 'Order not found'}), 404
        expected = valid_transitions.get(order['status'])
        if new_status != expected:
            conn.close()
            return jsonify({'error': f"Cannot transition from '{order['status']}' to '{new_status}'"}), 400
        conn.execute(
            "UPDATE orders SET status = ?, updated_at = datetime('now') WHERE order_id = ?",
            (new_status, order_id)
        )
        conn.commit()
        conn.close()
        return jsonify({'message': f'Order status updated to {new_status}'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Pharmacy API is running'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)