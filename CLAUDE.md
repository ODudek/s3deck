# S3 Deck — Instructions for Claude / Developers

This file provides a concise overview of the project and developer instructions. It is intended as a quick reference for team members and assistant agents (e.g. Claude) — describing architecture, development startup, APIs and basic debugging tips.

## Project overview
S3 Deck is a desktop application built with Tauri + React (Vite) and a small Go backend. It enables browsing S3 buckets (and S3-compatible endpoints like MinIO) via a simple local HTTP API. The UI is implemented in React + Tailwind, packaged with Tauri; the Go backend exposes endpoints for listing buckets, listing objects, and saving connection configurations.

Key components:
- Frontend: `src/` (React + Vite)
- Tauri wrapper and config: `src-tauri/`
- Go backend: `src-tauri/go-backend/` — modular HTTP server with endpoints for S3 operations
  - `main.go` — entry point and server setup
  - `handlers.go` — HTTP request handlers
  - `s3client.go` — S3 operations using AWS SDK v2
  - `config.go` — configuration management
  - `models.go` — data structures
  - `utils.go` — utility functions
- User configuration file: `~/.s3deck/config.json`

## Quick start (development)
The simplest way to start the development environment:

- From repository root:
  - `./dev.sh` (startup script that launches required processes)
  - or `npm run start` (alias to the script)

Alternative commands:
- Backend (hot-reload with air): `npm run dev:backend` — runs in `src-tauri/go-backend`
- Frontend (Vite): `npm run dev`
- Tauri (dev): `npm run dev:tauri`
- All together (concurrently): `npm run dev:all`

Before running the backend manually:
- `cd src-tauri/go-backend && go mod tidy`
- To build the backend binary: `cd src-tauri/go-backend && go build -o s3deck-backend .`

## npm scripts (from package.json)
- `npm run dev` — run Vite (frontend)
- `npm run build` — build frontend
- `npm run preview` — preview built frontend
- `npm run tauri` — run Tauri CLI
- `npm run dev:backend` — run Go backend with `air`
- `npm run dev:tauri` — `tauri dev`
- `npm run dev:all` — concurrently runs backend + tauri
- `npm run start` — alias to `./dev.sh`

## Backend — API & configuration
The Go backend listens on port `8082` by default and exposes the following endpoints:
- `GET /buckets` — returns configured buckets (from the configuration file)
- `GET /objects?bucket=<bucketId>&prefix=<prefix>` — returns objects and folders (common prefixes) for the given bucket
- `POST /add-bucket` — adds a new bucket configuration (JSON body)

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
The backend has been refactored into a modular architecture:
- **Entry point**: `src-tauri/go-backend/main.go` — server initialization and routing
- **HTTP handlers**: `src-tauri/go-backend/handlers.go` — request processing and validation
- **S3 operations**: `src-tauri/go-backend/s3client.go` — AWS SDK v2 integration
- **Configuration**: `src-tauri/go-backend/config.go` — config file management
- **Data models**: `src-tauri/go-backend/models.go` — request/response structures
- **Utilities**: `src-tauri/go-backend/utils.go` — helper functions

Key features:
- Uses AWS SDK for Go v2 to connect to S3-compatible services
- For custom endpoints (MinIO or other S3-compatible hosts) the `endpoint` field in the bucket config is used
- The backend adds a small, random `id` for new bucket configurations
- CORS is set permissively (`Access-Control-Allow-Origin: *`) to simplify local development
- Consistent JSON error responses with proper HTTP status codes
- UTC timestamps are sent as raw values for proper timezone handling in frontend

## Frontend — important notes
- Frontend calls the backend at `http://localhost:8082` (hard-coded in several files, e.g. `src/App.jsx`). Ensure the backend runs on that port in development.
- UI code is in `src/components/` (examples: `BucketsTable.jsx`, `ObjectsTable.jsx`, `AddBucketModal.jsx`).
- Built with React + Vite + Tailwind.

## Building and releasing
1. Build the backend binary (optional, for bundling):
   - `cd src-tauri/go-backend && go build -o go-s3-browser main.go`
2. Build the frontend:
   - `npm run build`
3. Build a desktop package with Tauri (requires Rust toolchain and Tauri CLI):
   - `npm run tauri build`

You can include the compiled Go binary in the final distribution if you want the backend bundled.

## Troubleshooting & common problems
- Backend doesn't start:
  - `cd src-tauri/go-backend && go mod tidy`
  - Run `air` (if using hot reload) or `go run main.go`
- Port 8082 busy:
  - `lsof -ti:8082 | xargs kill -9` or `lsof -i :8082` to find the process
- `air` not found:
  - `go install github.com/cosmtrek/air@latest` (or use the project's specified version)
- Frontend cannot reach backend:
  - Confirm backend is running and listening on port 8082; check that frontend is calling the correct URL
- Tauri build issues:
  - Ensure Rust (stable), `cargo` and `@tauri-apps/cli` are installed

## Development guidelines & testing
- When adding or changing backend endpoints:
  - Update the expected JSON shapes used by the frontend
  - Keep CORS requirements in mind (the backend currently allows all origins for dev)
- Configuration changes (adding/removing buckets) are persisted to `~/.s3deck/config.json` — test add/remove operations locally
- Consider adding unit tests around parsing and config handling for the backend when expanding functionality

## Security
- Do not commit credentials to the repository.
- For production, replace plain-text config storage with encrypted storage or OS-level secure stores (Keychain, Secret Service, etc.).
- Be cautious if shipping pre-configured builds with sensitive data.

## Quick file map — useful files to inspect
- `src/App.jsx` — main frontend component
- `src/components/*` — UI components
- `src-tauri/go-backend/main.go` — backend entry point and server setup
- `src-tauri/go-backend/handlers.go` — HTTP request handlers
- `src-tauri/go-backend/s3client.go` — S3 operations
- `src-tauri/go-backend/README.md` — detailed backend documentation
- `src-tauri/Cargo.toml` — Tauri configuration (Rust)
- `dev.sh` — convenience script to run the dev environment

## Notes for assistant agents (Claude)
- Use this file as a quick reference for running the project, debugging common issues, and locating primary integration points.
- If asked to modify behavior related to buckets/objects, check the modular backend files:
  - `src-tauri/go-backend/handlers.go` for HTTP request handling
  - `src-tauri/go-backend/s3client.go` for S3 operations
  - `src-tauri/go-backend/models.go` for data structures
  - Corresponding frontend components in `src/components/`
- The backend is now modular for better maintainability — see `src-tauri/go-backend/README.md` for detailed architecture.
