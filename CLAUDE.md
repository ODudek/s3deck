# S3 Deck — Instructions for Claude / Developers

This file provides a concise overview of the project and developer instructions. It is intended as a quick reference for team members and assistant agents (e.g. Claude) — describing architecture, development startup, Tauri commands and basic debugging tips.

## Project overview
S3 Deck is a desktop application built with Tauri + React (Vite) and a Rust backend. It enables browsing S3 buckets (and S3-compatible endpoints like MinIO) via Tauri IPC commands. The UI is implemented in React + Tailwind, packaged with Tauri; the Rust backend provides Tauri commands for S3 operations, configuration management, and file uploads.

Key components:
- Frontend: `src/` (React + Vite)
- Tauri application: `src-tauri/` — Rust-based desktop application with integrated S3 operations
  - `src/main.rs` — entry point
  - `src/lib.rs` — library entry point with Tauri setup
  - `src/commands.rs` — Tauri commands for frontend-backend communication
  - `src/s3_client.rs` — S3 operations using AWS SDK for Rust
  - `src/config.rs` — configuration management
  - `src/models.rs` — data structures and error types
- User configuration file: `~/.s3deck/config.json`

## Quick start (development)
The simplest way to start the development environment:

- From repository root:
  - `./dev.sh` (startup script that launches Tauri with Vite)
  - or `npm run start` (alias to the script)

Alternative commands:
- Frontend only (Vite): `npm run dev`
- Tauri with integrated backend: `npm run dev:tauri`

Prerequisites:
- Node.js 18+ and npm
- Rust toolchain (for Tauri)

## npm scripts (from package.json)
- `npm run dev` — run Vite (frontend)
- `npm run build` — build frontend
- `npm run preview` — preview built frontend
- `npm run tauri` — run Tauri CLI
- `npm run dev:tauri` — run Tauri with integrated Rust backend (includes Vite)
- `npm run start` — alias to `./dev.sh`

## Tauri Commands & Configuration
The Rust backend provides the following Tauri commands for frontend-backend communication:
- `get_buckets` — returns configured buckets (from the configuration file)
- `add_bucket` — adds a new bucket configuration
- `update_bucket` — updates an existing bucket configuration
- `delete_bucket_config` — removes a bucket configuration
- `get_bucket` — retrieves a specific bucket configuration
- `list_objects` — returns objects and folders for the given bucket and prefix
- `delete_object` — deletes a file or folder from S3
- `get_object_metadata` — retrieves detailed object information
- `upload_files` — uploads files/folders to S3 bucket
- `count_files` — counts files for upload progress tracking
- `get_folder_latest_modified` — retrieves latest modification date for folder contents
- `create_folder` — creates new folders with validation
- `rename_object` — renames files and folders with content-type detection

Configuration example (stored in `~/.s3deck/config.json`):
{
  "buckets": [
    {
      "id": "abcd1234",
      "name": "bucket-name",
      "displayName": "My S3",
      "region": "us-east-1",
      "accessKey": "AKIA...",
      "secretKey": "....",
      "endpoint": "https://s3.example.com" // optional
    }
  ]
}

Config file location:
- `~/.s3deck/config.json`

Security note: `accessKey` and `secretKey` are stored in plain text in this file. For production use consider encrypting the file or using a system credential store.

## How the backend works (implementation notes)
The backend is built as a pure Rust Tauri application with modular architecture:
- **Entry point**: `src-tauri/src/main.rs` — calls library entry point
- **Library setup**: `src-tauri/src/lib.rs` — Tauri app initialization and command registration
- **Tauri commands**: `src-tauri/src/commands.rs` — command handlers for frontend IPC communication
- **S3 operations**: `src-tauri/src/s3_client.rs` — AWS SDK for Rust integration
- **Configuration**: `src-tauri/src/config.rs` — config file management
- **Data models**: `src-tauri/src/models.rs` — request/response structures and error types

Key features:
- Uses AWS SDK for Rust to connect to S3-compatible services
- For custom endpoints (MinIO or other S3-compatible hosts) the `endpoint` field in the bucket config is used
- The backend generates random UUIDs for new bucket configurations
- Direct IPC communication between frontend and backend (no HTTP server needed)
- Proper error handling with custom error types that serialize for frontend consumption
- UTC timestamps with proper timezone handling
- Recursive directory upload support with progress tracking
- Universal drag & drop logic that correctly handles folders at any filesystem depth
- Smart S3 key building that preserves only the dragged item structure

## Frontend — important notes
- Frontend communicates with the Rust backend via Tauri's `invoke()` function (imported from `@tauri-apps/api/core`)
- All S3 operations are performed through Tauri commands - no HTTP requests needed
- UI code is in `src/components/` (examples: `BucketsTable.jsx`, `ObjectsTable.jsx`, `AddBucketModal.jsx`)
- Built with React + Vite + Tailwind CSS v4
- Upload functionality supports drag & drop of files and folders with Tauri's native file handling
- Settings are managed through `SettingsContext.jsx` with localStorage persistence
- Consistent styling uses `text-gray-900 dark:text-gray-300` for main text, `text-gray-500 dark:text-gray-400` for secondary text

## Building and releasing
1. Build the frontend:
   - `npm run build`
2. Build a desktop package with Tauri (requires Rust toolchain and Tauri CLI):
   - `npm run tauri build`

This creates platform-specific installers in `src-tauri/target/release/bundle/` with the Rust backend integrated.

## Troubleshooting & common problems
- Development environment doesn't start:
  - Ensure Node.js 18+ and Rust toolchain are installed
  - Run `npm install` to install dependencies
  - Port 1420 (Vite) busy: `lsof -ti:1420 | xargs kill -9`
- Tauri compilation errors:
  - Check `src-tauri/Cargo.toml` for correct dependencies
  - Run `cd src-tauri && cargo check` to verify Rust compilation
- Frontend cannot communicate with backend:
  - Verify Tauri commands are registered in `src-tauri/src/lib.rs`
  - Check that frontend uses `invoke()` from `@tauri-apps/api/core`
- Tauri build issues:
  - Ensure Rust (stable), `cargo` and `@tauri-apps/cli` are installed
  - For cross-platform builds: `rustup target add <target-triple>`

## Development guidelines & testing
- When adding or changing Tauri commands:
  - Add command handlers to `src-tauri/src/commands.rs`
  - Register new commands in `src-tauri/src/lib.rs` invoke_handler
  - Update frontend to use `invoke('command_name', { params })` pattern
  - Ensure proper error handling with serializable error types
- Configuration changes (adding/removing buckets) are persisted to `~/.s3deck/config.json` — test add/remove operations locally
- Consider adding unit tests for Rust backend functionality and integration tests for frontend-backend communication

## Security
- Do not commit credentials to the repository.
- For production, replace plain-text config storage with encrypted storage or OS-level secure stores (Keychain, Secret Service, etc.).
- Be cautious if shipping pre-configured builds with sensitive data.

## Quick file map — useful files to inspect
- `src/App.jsx` — main frontend component
- `src/components/*` — UI components
- `src/components/ConfigView.jsx` — Settings/configuration interface
- `src/contexts/SettingsContext.jsx` — Application settings management
- `src/hooks/useS3Operations.js` — S3 operations hooks using Tauri invoke
- `src/hooks/useUpload.js` — Upload functionality with drag & drop support
- `src-tauri/src/lib.rs` — Tauri app setup and command registration
- `src-tauri/src/commands.rs` — Tauri command handlers
- `src-tauri/src/s3_client.rs` — S3 operations using AWS SDK for Rust
- `src-tauri/src/models.rs` — Data structures and error types
- `src-tauri/Cargo.toml` — Rust dependencies and Tauri configuration
- `dev.sh` — convenience script to run the dev environment
- `docs/demo.gif` — Application demo for README

## Application Settings System
Settings are managed through React Context (`SettingsContext.jsx`) with localStorage persistence:

Default settings:
- `theme: 'light'` — UI theme (light/dark/auto)
- `maxFileSize: 100` — Maximum upload file size in MB
- `showHiddenFiles: false` — Display files starting with dot
- `showFolderModifiedDates: false` — Display folder modification dates (performance impact)
- `autoRefresh: true` — Automatically refresh object lists
- `autoRefreshInterval: 30` — Refresh interval in seconds
- `confirmDelete: true` — Show confirmation dialogs before deletions

## Notes for assistant agents (Claude)
- Use this file as a quick reference for running the project, debugging common issues, and locating primary integration points.
- If asked to modify behavior related to buckets/objects, check the Rust backend files:
  - `src-tauri/src/commands.rs` for Tauri command handlers
  - `src-tauri/src/s3_client.rs` for S3 operations
  - `src-tauri/src/models.rs` for data structures
  - Corresponding frontend components in `src/components/`
- For settings-related changes, check `src/contexts/SettingsContext.jsx` and `src/components/ConfigView.jsx`
- The backend is implemented in pure Rust using Tauri's IPC system for frontend-backend communication.
- When debugging drag & drop issues, focus on `useUpload.js` basePath calculation and `commands.rs` build_s3_key function.
