@echo off
echo Starting Chief AI Assistant...

:: Start Backend
echo Starting Backend Server...
start "Chief Backend" cmd /k "cd backend && python -m uvicorn server:app --reload --port 8000"

:: Start Frontend
echo Starting Frontend Server...
start "Chief Frontend" cmd /k "cd frontend && npm start"

echo Servers started!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
