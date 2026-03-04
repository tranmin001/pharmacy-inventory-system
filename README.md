# PharmTrack

A full-stack pharmacy inventory management system with ML-powered stockout predictions, built from real experience as a pharmacy technician.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1-000000?logo=flask&logoColor=white)
![C++](https://img.shields.io/badge/C++-11-00599C?logo=cplusplus&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.6-F7931E?logo=scikitlearn&logoColor=white)

<!-- Screenshots — replace these with actual screenshots -->
<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="Dashboard" width="80%" />
</p>
<p align="center"><em>Screenshots coming soon</em></p>

---

## Features

- **Medication CRUD** — Add, edit, delete, and search medications with validation for name, quantity, price, and expiration
- **Stockout Predictions** — ML model (LinearRegression) analyzes usage patterns and flags medications at critical, high, or medium risk
- **Batch Shipment Receiving** — Receive multi-item shipments with automatic inventory updates and shipment history tracking
- **Reorder Suggestions** — Auto-generated reorder list based on stock levels, with one-click order placement
- **Order Tracking** — Track order status from pending through delivery
- **Charts & Visualizations** — Interactive bar charts for inventory levels and prediction risk distribution
- **PDF Export** — Generate PDF reports for inventory lists, reorder suggestions, and shipment records
- **Advanced Filtering** — Filter by stock status (low/expired/expiring), search by name, sort by any column
- **Dark Mode** — Toggle between light and dark themes, persisted in localStorage
- **Landing Page** — Portfolio-style landing page with scroll animations and project overview

## Architecture

The system has four layers that all share a single SQLite database:

```
React Frontend (port 3000)
    |  Axios HTTP
    v
Flask REST API (port 5000)  <-->  ML Predictor (scikit-learn)
    |  sqlite3
    v
SQLite Database (build/pharmacy_inventory.db)
    ^  sqlite3
    |
C++ CLI (build/PharmacyInventory.exe)
```

| Layer | Tech | Role |
|-------|------|------|
| **Frontend** | React 19, Recharts, Axios, jsPDF | Dashboard UI, charts, PDF export |
| **API** | Python, Flask, flask-cors | REST endpoints, validation, CORS |
| **Core** | C++11, CMake, SQLite3 | CLI interface, direct DB operations |
| **ML** | scikit-learn, Pandas, NumPy | Stockout prediction with risk levels |

## Setup

### Prerequisites

- CMake 3.10+ and a C++11 compiler
- Python 3.10+
- Node.js 18+

### 1. C++ CLI

```bash
cd build
cmake ..
cmake --build .
./PharmacyInventory          # Linux/Mac
./PharmacyInventory.exe      # Windows
```

This creates the SQLite database at `build/pharmacy_inventory.db` on first run.

### 2. Flask API

```bash
cd api
python -m venv venv
source venv/bin/activate     # Windows: venv\Scripts\activate
pip install flask flask-cors scikit-learn pandas numpy
python app.py
```

Runs on `http://127.0.0.1:5000`. Connects to `../build/pharmacy_inventory.db`.

### 3. React Frontend

```bash
cd frontend
npm install
npm start
```

Opens at `http://localhost:3000`. Make sure the Flask API is running first so the dashboard can load data.

## API Endpoints

### Medications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/medications` | List all medications |
| GET | `/api/medications/:id` | Get a single medication |
| POST | `/api/medications` | Add a new medication |
| PUT | `/api/medications/:id` | Update a medication |
| DELETE | `/api/medications/:id` | Delete a medication |
| GET | `/api/medications/low-stock` | Get medications with low quantity |
| GET | `/api/medications/expired` | Get expired medications |

### Predictions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/predictions` | Get stockout predictions for all medications |
| GET | `/api/predictions/:id` | Get prediction for a single medication |

### Shipments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shipments` | List all shipments |
| GET | `/api/shipments/next-id` | Get next available shipment ID |
| POST | `/api/shipments` | Receive a new shipment |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/suggestions` | Get auto-generated reorder suggestions |
| POST | `/api/orders` | Place a new order |
| PUT | `/api/orders/:order_id/status` | Update order status |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

## About

I built PharmTrack while working as a pharmacy technician at Safeway. I kept running into the same inventory problems — medications running low without warning, manual reorder tracking, no easy way to see what was expiring soon. I wanted to build something that actually addressed those pain points.

I'm a Computer Science student at UW Bothell, and this project was a way to connect what I was learning in class (data structures, databases, ML) with problems I dealt with every shift. The C++ core was the starting point, then I added the Flask API and React frontend to make it usable beyond the command line.

## License

This project is for portfolio and educational purposes.
