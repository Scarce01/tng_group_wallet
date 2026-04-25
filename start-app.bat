@echo off
REM TNG Group Wallet - launches Python (FastAPI) backend on 4000 and web on 5173
cd /d "%~dp0"

REM Make sure no stale node TS-backend is squatting on port 4000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000 " ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

start "TNG Backend (Python 4000)" cmd /k "cd backend && uvicorn app.main:app --host 0.0.0.0 --port 4000 --reload"
start "TNG Web (5173)" cmd /k "cd web && npm run dev"

REM Wait a moment for vite to boot, then open browser
timeout /t 4 /nobreak >nul
start "" "http://localhost:5173"
exit
