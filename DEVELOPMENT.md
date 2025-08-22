# S3 Deck - Development Setup

## Quick Start

Najszybszy sposób na uruchomienie środowiska deweloperskiego:

```bash
npm run start
```

lub

```bash
./dev.sh
```

To uruchomi:
- ✅ Go backend z hot reload (air)
- ✅ Tauri aplikację z React frontend
- ✅ Automatyczne restarty przy zmianach w kodzie

## Alternatywne opcje

### 1. Używając concurrently (jeden terminal)
```bash
npm run dev:all
```

### 2. Osobne procesy (wiele terminali)

**Terminal 1 - Backend Go:**
```bash
npm run dev:backend
```

**Terminal 2 - Tauri + Frontend:**
```bash
npm run dev:tauri
```

### 3. Tylko frontend (bez Tauri)
```bash
npm run dev
```

## Co się dzieje pod spodem?

### Hot Reload Setup:
- **Go Backend**: Używa `air` do automatycznego rebuildu przy zmianach w `.go` files
- **React Frontend**: Używa Vite HMR
- **Tauri**: Automatycznie restartuje przy zmianach w Rust kodzie

### Porty:
- Backend API: `http://localhost:8080`
- Frontend dev server: `http://localhost:1420` (tylko bez Tauri)
- Tauri app: Native okno

## Development Workflow

1. **Zmiana w Go (backend)**: 
   - Air automatycznie rebuiluje i restartuje backend
   - Tauri używa nowej wersji automatycznie

2. **Zmiana w React (frontend)**:
   - Vite HMR natychmiast odświeża widok
   - Nie trzeba restartować Tauri

3. **Zmiana w Rust (Tauri)**:
   - Tauri automatycznie rebuiluje i restartuje aplikację

## Przydatne komendy

```bash
# Zatrzymaj wszystkie procesy
pkill -f "air"
pkill -f "go-s3-browser"

# Sprawdź co używa portu 8080
lsof -i :8080

# Builduj backend ręcznie
cd src-tauri/go-backend && go build -o go-s3-browser main.go
```

## Troubleshooting

**Problem**: Backend nie startuje
**Rozwiązanie**: 
```bash
cd src-tauri/go-backend
go mod tidy
air
```

**Problem**: Port 8080 zajęty
**Rozwiązanie**: 
```bash
lsof -ti:8080 | xargs kill -9
```

**Problem**: Air nie znaleziony
**Rozwiązanie**: 
```bash
go install github.com/air-verse/air@latest
```