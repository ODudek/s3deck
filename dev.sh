#!/bin/bash

echo "🚀 Starting S3 Deck Development Environment..."

# Kill any existing processes on port 8080
echo "🧹 Cleaning up existing processes..."
pkill -f "go-s3-browser" 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

echo "📦 Starting Go backend with hot reload..."
cd src-tauri/go-backend
air &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

echo "🎨 Starting Frontend (Vite)..."
cd ../..
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 2

echo "🖥️ Starting Tauri application..."
npm run tauri dev &
TAURI_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down development environment..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    kill $TAURI_PID 2>/dev/null || true
    pkill -f "air" 2>/dev/null || true
    pkill -f "go-s3-browser" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    exit 0
}

# Set up trap for cleanup
trap cleanup INT TERM

echo "✅ Development environment started!"
echo "📝 Backend: http://localhost:8080"
echo "🎯 Press Ctrl+C to stop all processes"

# Wait for processes
wait