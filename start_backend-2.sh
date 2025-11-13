#!/bin/bash
echo "Starting Certificate Dashboard Backend..."
cd backend || exit
python3 -m uvicorn app:app --host 0.0.0.0 --port $PORT
