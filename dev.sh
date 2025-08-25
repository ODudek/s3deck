#!/bin/bash

echo "🚀 Starting S3 Deck Development Environment..."

# Kill any existing processes on ports 1420 and 1421
echo "🧹 Cleaning up existing processes..."
lsof -ti:1420 | xargs kill -9 2>/dev/null || true
lsof -ti:1421 | xargs kill -9 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "tauri" 2>/dev/null || true

# Wait a moment for processes to cleanup
sleep 1

echo "🖥️ Starting Tauri application with Rust backend..."
npm run dev:tauri

echo "✅ Development environment stopped!"