#!/bin/bash

# Map Tauri target triple to Go GOOS and GOARCH
case "$TAURI_ENV_TARGET_TRIPLE" in
    "x86_64-pc-windows-msvc")
        export GOOS=windows
        export GOARCH=amd64
        ;;
    "i686-pc-windows-msvc")
        export GOOS=windows
        export GOARCH=386
        ;;
    "x86_64-unknown-linux-gnu")
        export GOOS=linux
        export GOARCH=amd64
        ;;
    "i686-unknown-linux-gnu")
        export GOOS=linux
        export GOARCH=386
        ;;
    "x86_64-apple-darwin")
        export GOOS=darwin
        export GOARCH=amd64
        ;;
    "aarch64-apple-darwin")
        export GOOS=darwin
        export GOARCH=arm64
        ;;
    "aarch64-unknown-linux-gnu")
        export GOOS=linux
        export GOARCH=arm64
        ;;
    *)
        echo "Warning: Unknown target triple: $TAURI_ENV_TARGET_TRIPLE"
        echo "Falling back to native compilation"
        unset GOOS
        unset GOARCH
        ;;
esac

echo "Building Go backend for $GOOS/$GOARCH (target: $TAURI_ENV_TARGET_TRIPLE)"
go build -o s3deck-backend$TAURI_ENV_EXECUTABLE_EXTENSION .