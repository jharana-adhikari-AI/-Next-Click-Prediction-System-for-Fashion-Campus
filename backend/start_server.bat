@echo off
echo Starting FastAPI Backend Server...
echo Models will be loaded from backend/models/
echo.
python -m uvicorn app:app --reload --port 8000
