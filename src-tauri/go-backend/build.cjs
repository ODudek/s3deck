#!/usr/bin/env node

const { spawn } = require('child_process');
const process = require('process');

// Map Tauri target triple to Go GOOS and GOARCH
const targetTriple = process.env.TAURI_ENV_TARGET_TRIPLE;
const executableExt = process.env.TAURI_ENV_EXECUTABLE_EXTENSION || '';

let goos = '';
let goarch = '';

switch (targetTriple) {
  case 'x86_64-pc-windows-msvc':
    goos = 'windows';
    goarch = 'amd64';
    break;
  case 'i686-pc-windows-msvc':
    goos = 'windows';
    goarch = '386';
    break;
  case 'x86_64-unknown-linux-gnu':
    goos = 'linux';
    goarch = 'amd64';
    break;
  case 'i686-unknown-linux-gnu':
    goos = 'linux';
    goarch = '386';
    break;
  case 'x86_64-apple-darwin':
    goos = 'darwin';
    goarch = 'amd64';
    break;
  case 'aarch64-apple-darwin':
    goos = 'darwin';
    goarch = 'arm64';
    break;
  case 'aarch64-unknown-linux-gnu':
    goos = 'linux';
    goarch = 'arm64';
    break;
  default:
    console.log(`Warning: Unknown target triple: ${targetTriple}`);
    console.log('Falling back to native compilation');
    break;
}

console.log(`Building Go backend for ${goos}/${goarch} (target: ${targetTriple})`);

// Set environment variables for Go
const env = { ...process.env };
if (goos) env.GOOS = goos;
if (goarch) env.GOARCH = goarch;

// Run go build
const goBuild = spawn('go', ['build', '-o', `s3deck-backend${executableExt}`, '.'], {
  env,
  stdio: 'inherit',
  shell: true
});

goBuild.on('close', (code) => {
  process.exit(code);
});

goBuild.on('error', (err) => {
  console.error('Error running go build:', err);
  process.exit(1);
});