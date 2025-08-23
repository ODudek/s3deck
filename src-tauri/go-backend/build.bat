@echo off

REM Map Tauri target triple to Go GOOS and GOARCH
if "%TAURI_ENV_TARGET_TRIPLE%"=="x86_64-pc-windows-msvc" (
    set GOOS=windows
    set GOARCH=amd64
) else if "%TAURI_ENV_TARGET_TRIPLE%"=="i686-pc-windows-msvc" (
    set GOOS=windows
    set GOARCH=386
) else if "%TAURI_ENV_TARGET_TRIPLE%"=="x86_64-unknown-linux-gnu" (
    set GOOS=linux
    set GOARCH=amd64
) else if "%TAURI_ENV_TARGET_TRIPLE%"=="i686-unknown-linux-gnu" (
    set GOOS=linux
    set GOARCH=386
) else if "%TAURI_ENV_TARGET_TRIPLE%"=="x86_64-apple-darwin" (
    set GOOS=darwin
    set GOARCH=amd64
) else if "%TAURI_ENV_TARGET_TRIPLE%"=="aarch64-apple-darwin" (
    set GOOS=darwin
    set GOARCH=arm64
) else if "%TAURI_ENV_TARGET_TRIPLE%"=="aarch64-unknown-linux-gnu" (
    set GOOS=linux
    set GOARCH=arm64
) else (
    echo Warning: Unknown target triple: %TAURI_ENV_TARGET_TRIPLE%
    echo Falling back to native compilation
    set GOOS=
    set GOARCH=
)

echo Building Go backend for %GOOS%/%GOARCH% (target: %TAURI_ENV_TARGET_TRIPLE%)
go build -o s3deck-backend%TAURI_ENV_EXECUTABLE_EXTENSION% .