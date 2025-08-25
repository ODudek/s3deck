#!/bin/bash

# Cross-platform build script for S3Deck
# Pure Tauri/Rust implementation - no Go backend required

echo "Building S3Deck for multiple platforms..."

# Build for macOS (Intel)
echo "Building for macOS Intel..."
npm run tauri build -- --target x86_64-apple-darwin

# Build for macOS (Apple Silicon) 
echo "Building for macOS Apple Silicon..."
npm run tauri build -- --target aarch64-apple-darwin

# Build for Windows (requires Windows toolchain or cross-compilation setup)
echo "Building for Windows..."
npm run tauri build -- --target x86_64-pc-windows-msvc

# Build for Linux (requires Linux toolchain or cross-compilation setup)  
echo "Building for Linux..."
npm run tauri build -- --target x86_64-unknown-linux-gnu

echo "Cross-platform builds completed!"
echo "Note: Cross-platform builds require appropriate Rust toolchains."
echo "Install with: rustup target add <target-triple>"