#!/bin/bash

# Cross-platform build script for S3Deck

echo "Building S3Deck for multiple platforms..."

# Build for macOS (Intel)
echo "Building for macOS Intel..."
cd src-tauri/go-backend
GOOS=darwin GOARCH=amd64 go build -o s3deck-backend-darwin-amd64 .
cd ../..
npm run tauri build -- --target x86_64-apple-darwin

# Build for macOS (Apple Silicon) 
echo "Building for macOS Apple Silicon..."
cd src-tauri/go-backend
GOOS=darwin GOARCH=arm64 go build -o s3deck-backend-darwin-arm64 .
cd ../..
npm run tauri build -- --target aarch64-apple-darwin

# Build for Windows
echo "Building for Windows..."
cd src-tauri/go-backend
GOOS=windows GOARCH=amd64 go build -o s3deck-backend-windows-amd64.exe .
cd ../..
npm run tauri build -- --target x86_64-pc-windows-msvc

# Build for Linux
echo "Building for Linux..."
cd src-tauri/go-backend
GOOS=linux GOARCH=amd64 go build -o s3deck-backend-linux-amd64 .
cd ../..
npm run tauri build -- --target x86_64-unknown-linux-gnu

echo "Cross-platform builds completed!"