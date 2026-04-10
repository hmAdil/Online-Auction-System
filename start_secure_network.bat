@echo off
echo ============================================
echo   Animus Auction System - Secure Multi-Device
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo [1/3] Starting TCP Auction Server...
start "TCP Server" cmd /k "python auction_server/server.py"
timeout /t 2 /nobreak >nul

echo [2/3] Starting WebSocket Bridge...
start "WebSocket Bridge" cmd /k "python web_bridge/bridge.py"
timeout /t 5 /nobreak >nul

echo [3/3] Building and Starting React Frontend on Network...
start "Frontend (Network)" cmd /k "cd frontend && echo Building frontend... && npm run build && echo Starting preview... && npm run preview -- --host"

echo.
echo ============================================
echo   All servers starting up...
echo   - TCP Server:    127.0.0.1:5000
echo   - WebSocket:     0.0.0.0:8000
echo   - Frontend:      Please check the 'Frontend' terminal for your local IP
echo ============================================
echo.
echo Admin credentials: hmAdil
echo.
echo To access from your phone or another device, look for the Network URL in
echo the Frontend terminal (usually http://192.168.1.something:4173) Let it 
echo finish building first!
echo ============================================
