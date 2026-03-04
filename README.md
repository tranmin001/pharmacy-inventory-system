# PharmTrack

A full-stack pharmacy inventory management system with ML-powered stockout predictions, built from real experience as a pharmacy technician.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1-000000?logo=flask&logoColor=white)
![C++](https://img.shields.io/badge/C++-11-00599C?logo=cplusplus&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.6-F7931E?logo=scikitlearn&logoColor=white)

## Live Demo

**[pharmacy-inventory-system-three.vercel.app](https://pharmacy-inventory-system-three.vercel.app)**

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | [pharmacy-inventory-system-three.vercel.app](https://pharmacy-inventory-system-three.vercel.app) |
| API | Railway | [pharmacy-inventory-system-production.up.railway.app](https://pharmacy-inventory-system-production.up.railway.app) |

---

## Screenshots

<!-- Replace these with actual screenshots -->
| Dashboard | Stockout Predictions |
|-----------|---------------------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Predictions](docs/screenshots/predictions.png) |

| Shipment Receiving | Reorder System |
|-------------------|----------------|
| ![Shipments](docs/screenshots/shipments.png) | ![Reorder](docs/screenshots/reorder.png) |

*Screenshots coming soon*

---

## Features

- **Full CRUD Inventory Management** — Add, edit, delete medications with validation for name, strength, quantity, price, and expiration date
- **Real-Time Search** — Instantly filter medications by name as you type
- **ML-Powered Stockout Predictions** — scikit-learn LinearRegression model analyzes usage patterns and flags medications at critical, high, or medium risk of running out
- **Bulk Shipment Receiving** — Receive multi-item shipments in one form, with automatic inventory updates and full shipment history
- **Automated Reorder System** — Auto-generated reorder suggestions based on stock levels, with one-click order placement and status tracking
- **Data Visualization** — Interactive Recharts bar charts for inventory levels and prediction risk distribution
- **PDF Export** — Generate downloadable PDF reports for inventory lists, reorder suggestions, and shipment records
- **Advanced Filtering** — Filter by stock status (low stock, expired, expiring soon), sort by any column
- **Dark Mode** — Toggle between light and dark themes, persisted in localStorage
- **Landing Page** — Portfolio-style landing page with scroll animations and project overview

## Architecture

The system has four layers that all share a single SQLite database:

```
React Frontend (Vercel)
    |  Axios HTTP
    v
Flask REST API (Railway)  <-->  ML Predictor (scikit-learn)
    |  sqlite3
    v
SQLite Database
    ^  sqlite3
    |
C++ CLI (local)
```

| Layer | Tech | Role |
|-------|------|------|
| **Frontend** | React 19, Recharts, Axios, jsPDF | Dashboard UI, charts, PDF export |
| **API** | Python, Flask, flask-cors | REST endpoints, validation, CORS |
| **Core** | C++11, CMake, SQLite3 | CLI interface, direct DB operations |
| **ML** | scikit-learn, Pandas, NumPy | Stockout prediction with risk levels |

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

## Local Development

If you want to run PharmTrack locally, here's how to set up each component.

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

Runs on `http://127.0.0.1:5000`. The API seeds sample medications on first startup if the database is empty.

### 3. React Frontend

```bash
cd frontend
npm install
npm start
```

Opens at `http://localhost:3000`. Set `REACT_APP_API_URL` to point to a different API server, or it defaults to `http://127.0.0.1:5000/api`.

## About

I built PharmTrack while working as a pharmacy technician at Safeway. I kept running into the same inventory problems — medications running low without warning, manual reorder tracking, no easy way to see what was expiring soon. I wanted to build something that actually addressed those pain points.

I'm a Computer Science student at UW Bothell, and this project was a way to connect what I was learning in class (data structures, databases, ML) with problems I dealt with every shift. The C++ core was the starting point, then I added the Flask API and React frontend to make it usable beyond the command line.

## License

This project is for portfolio and educational purposes.
