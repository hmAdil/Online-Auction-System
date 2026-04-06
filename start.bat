@echo off
echo ============================================
echo   Animus Auction System - Startup Script
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
timeout /t 2 /nobreak >nul

echo [3/3] Starting React Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo   All servers starting up...
echo   - TCP Server:    localhost:5000
echo   - WebSocket:     localhost:8000
echo   - Frontend:      http://localhost:5173
echo ============================================
echo.
echo Admin credentials: hmAdil
echo.
echo Close any terminal window to stop that service.
echo ============================================
