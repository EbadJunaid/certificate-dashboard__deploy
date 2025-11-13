# Certificate Analytics Dashboard Backend

This is the backend API for the Certificate Analytics Dashboard, built with FastAPI and MongoDB.

## Requirements

- Python 3.8+
- MongoDB instance

## Setup

1. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

2. Make sure MongoDB is running on localhost:27017

3. Start the API server:

   ```
   python app.py
   ```

   Or use uvicorn directly:

   ```
   uvicorn app:app --reload
   ```

4. The API will be available at http://localhost:8000

5. Interactive API documentation is available at http://localhost:8000/docs

## API Endpoints

- `/api/overview` - Summary of all certificates
- `/api/certificates` - All certificates
- `/api/certificates/active` - Active certificates
- `/api/certificates/expired` - Expired certificates
- `/api/types` - Certificate count by type
- `/api/timeline` - Certificate issuance over time
- `/api/issuers` - Top certificate issuers
- `/api/expiring` - Certificates expiring soon
- `/api/regions` - Certificate count by region
- `/api/departments` - Certificate count by department
- `/api/ml/predict-expiry` - ML predictions for expiry risk
- `/api/ml/anomalies` - ML anomaly detection

## Mock Data

The application seeds the MongoDB database with mock certificate data on startup if the collection is empty.
