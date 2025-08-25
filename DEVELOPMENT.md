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
- ✅ Tauri aplikację z React frontend
- ✅ Automatyczne restarty przy zmianach w kodzie

## Alternatywne opcje

### 1. Używając concurrently (jeden terminal)
```bash
npm run dev:all
```

### 2. Osobne procesy (wiele terminali)

**Terminal 1 - Tauri + Frontend:**
```bash
npm run dev:tauri
```

### 3. Tylko frontend (bez Tauri)
```bash
npm run dev
```

## Co się dzieje pod spodem?

### Hot Reload Setup:
- **React Frontend**: Używa Vite HMR
- **Tauri**: Automatycznie restartuje przy zmianach w Rust kodzie

### Porty:
- Frontend dev server: `http://localhost:1420` (tylko bez Tauri)
- Tauri app: Native okno

## Development Workflow

1. **Zmiana w React (frontend)**:
   - Vite HMR natychmiast odświeża widok
   - Nie trzeba restartować Tauri

2. **Zmiana w Rust (Tauri)**:
   - Tauri automatycznie rebuiluje i restartuje aplikację

## Przydatne komendy

```bash
# Sprawdź co używa portu 1420
lsof -i :1420

# Builduj backend ręcznie
cd src-tauri && cargo build
```

## Troubleshooting

**Problem**: Tauri nie startuje
**Rozwiązanie**: 
```bash
cd src-tauri
cargo check
npm run dev:tauri
```

**Problem**: Port 1420 zajęty
**Rozwiązanie**: 
```bash
lsof -ti:1420 | xargs kill -9
```

**Problem**: Błędy kompilacji Rust
**Rozwiązanie**: 
```bash
cd src-tauri
cargo fmt
cargo clippy
```