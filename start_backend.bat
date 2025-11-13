@echo off
echo Starting Certificate Dashboard Backend...
echo.
cd backend
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload

