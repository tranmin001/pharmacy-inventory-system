from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join('..', 'build', 'pharmacy_inventory.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

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
        conn = get_db_connection()
        cursor = conn.cursor()
        max_id = cursor.execute('SELECT MAX(id) FROM medications').fetchone()[0]
        next_id = (max_id or 0) + 1
        cursor.execute('INSERT INTO medications (id, name, quantity, expiration_date, price) VALUES (?, ?, ?, ?, ?)',
                      (next_id, data['name'], data['quantity'], data['expiration_date'], data['price']))
        conn.commit()
        conn.close()
        return jsonify({'id': next_id, 'message': 'Medication added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/medications/<int:med_id>', methods=['PUT'])
def update_medication(med_id):
    try:
        data = request.get_json()
        conn = get_db_connection()
        cursor = conn.cursor()
        existing = cursor.execute('SELECT * FROM medications WHERE id = ?', (med_id,)).fetchone()
        if existing is None:
            conn.close()
            return jsonify({'error': 'Medication not found'}), 404
        cursor.execute('UPDATE medications SET name = ?, quantity = ?, expiration_date = ?, price = ? WHERE id = ?',
                      (data.get('name'), data.get('quantity'), data.get('expiration_date'), data.get('price'), med_id))
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
        from datetime import date
        today = date.today().isoformat()
        conn = get_db_connection()
        medications = conn.execute('SELECT * FROM medications WHERE expiration_date < ?', (today,)).fetchall()
        conn.close()
        return jsonify([dict(med) for med in medications]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Pharmacy API is running'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)