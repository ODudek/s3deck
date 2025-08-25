#!/bin/bash

# Fix macOS bundle after build to allow unsigned apps to run
# Run this after: npm run tauri:build

BUNDLE_PATH="src-tauri/target/release/bundle/macos/S3Deck.app"

if [ -d "$BUNDLE_PATH" ]; then
    echo "Removing quarantine attribute from S3Deck.app..."
    xattr -cr "$BUNDLE_PATH"
    echo "✅ Fixed macOS bundle - app should now run without security warnings"
else
    echo "❌ Bundle not found at: $BUNDLE_PATH"
    echo "Make sure to run 'npm run tauri:build' first"
    exit 1
fi