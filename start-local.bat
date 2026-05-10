@echo off
echo ============================================
echo   IRONMAN FITNESS - Local Development
echo ============================================
echo.

:: Start local PostgreSQL via Docker
echo [1/4] Starting local PostgreSQL...
docker-compose up postgres -d
timeout /t 5 /nobreak > nul

:: Init database tables
echo [2/4] Initialising database tables...
cd backend
call npm run db:init
cd ..

:: Start backend in new window
echo [3/4] Starting backend (port 5000)...
start "GYM Backend" cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 3 /nobreak > nul

:: Start frontend in new window
echo [4/4] Starting frontend (port 3000)...
start "GYM Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo   Opening browser in 5 seconds...
echo   URL: http://localhost:3000
echo ============================================
timeout /t 5 /nobreak > nul
start http://localhost:3000
