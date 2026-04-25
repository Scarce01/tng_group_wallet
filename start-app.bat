@echo off
REM TNG Group Wallet — launches backend (port 4000) and web (port 5173) in separate windows
cd /d "%~dp0"

start "TNG Backend (4000)" cmd /k "npm run dev"
start "TNG Web (5173)" cmd /k "cd web && npm run dev"

REM Wait a moment for vite to boot, then open browser
timeout /t 4 /nobreak >nul
start "" "http://localhost:5173"
exit
