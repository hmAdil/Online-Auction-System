#!/bin/bash

echo "============================================"
echo "  Animus Auction System - Startup Script"
echo "============================================"
echo ""

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "[ERROR] Python is not installed or not in PATH"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH"
    exit 1
fi

echo "[1/3] Starting TCP Auction Server..."
python auction_server/server.py &
SERVER_PID=$!
sleep 2

echo "[2/3] Starting WebSocket Bridge..."
python web_bridge/bridge.py &
BRIDGE_PID=$!
sleep 2

echo "[3/3] Starting React Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "============================================"
echo "  All servers started!"
echo "  - TCP Server:    localhost:5000"
echo "  - WebSocket:     localhost:8000"
echo "  - Frontend:      http://localhost:5173"
echo "============================================"
echo ""
echo "Admin credentials: hmAdil"
echo ""
echo "Press Ctrl+C to stop all services."
echo "============================================"

# Wait for all background processes
wait
