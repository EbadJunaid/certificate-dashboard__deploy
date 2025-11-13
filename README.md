# Certificate Analytics Dashboard

A full-stack certificate analytics dashboard with Python backend and Bootstrap 5 frontend.

## Overview

This project provides a comprehensive dashboard for analyzing SSL/TLS certificates and other security certificates. It features a FastAPI backend connected to MongoDB and a responsive frontend built with Bootstrap 5 and vanilla JavaScript.

![Certificate Analytics Dashboard](https://via.placeholder.com/800x400?text=Certificate+Analytics+Dashboard)

## Features

- **10 Interactive Dashboard Views:**

  1. All Certificates Overview
  2. Active vs Expired Certificates
  3. Certificate Type Distribution
  4. Issuance Over Time (timeline graph)
  5. Top Issuers
  6. Certificates Nearing Expiry
  7. Region-wise Breakdown
  8. Department Distribution
  9. ML Predictions (expiry risk)
  10. Anomaly Detection

- **Backend Features:**

  - FastAPI RESTful API
  - MongoDB integration
  - Mock data generation
  - ML simulation endpoints

- **Frontend Features:**
  - Responsive Material 3 design
  - Interactive charts with Chart.js
  - Pure JavaScript (no frameworks)
  - Bootstrap 5 components
  - Mobile-friendly interface

## Project Structure

```
certificate-dashboard/
├── backend/             # Python FastAPI backend
│   ├── app.py           # Main application file
│   ├── requirements.txt # Python dependencies
│   └── README.md        # Backend documentation
│
└── frontend/            # Bootstrap 5 & JavaScript frontend
    ├── index.html       # Main HTML file
    ├── css/             # CSS styles
    ├── js/              # JavaScript files
    └── README.md        # Frontend documentation
```

## Requirements

- Python 3.8+
- MongoDB
- Web browser
- Node.js (optional, for serving frontend)

## Quick Start

### Backend Setup

1. Install Python dependencies:

   ```
   cd backend
   pip install -r requirements.txt
   ```

2. Make sure MongoDB is running on localhost:27017

3. Start the API server:

   ```
   python app.py
   ```

   The API will be available at http://localhost:8000

### Frontend Setup

1. Serve the frontend files using any static file server:

   **Python:**

   ```
   cd frontend
   python -m http.server 8080
   ```

   **Node.js:**

   ```
   npx serve frontend -p 8080
   ```

2. Open the dashboard in a browser:
   ```
   http://localhost:8080
   ```

## License

MIT

## Acknowledgements

- [Bootstrap](https://getbootstrap.com/)
- [Chart.js](https://www.chartjs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [PyMongo](https://pymongo.readthedocs.io/)
