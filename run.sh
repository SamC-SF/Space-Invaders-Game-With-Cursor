#!/bin/bash

# Simple script to run the Space Invaders game
# This will start a local web server so you can play the game

echo "Starting Space Invaders game..."
echo ""

# Kill any process using port 8000
PORT_PID=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$PORT_PID" ]; then
    echo "Port 8000 is in use. Killing process $PORT_PID..."
    kill -9 $PORT_PID 2>/dev/null
    sleep 1
fi

echo "The game will open in your browser at http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m http.server 8000
else
    echo "Python not found. Opening index.html directly..."
    if command -v open &> /dev/null; then
        open index.html
    elif command -v xdg-open &> /dev/null; then
        xdg-open index.html
    else
        echo "Please open index.html in your web browser manually"
    fi
fi
