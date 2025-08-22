# S3 Deck — Instrukcja dla Claude / Developerów

Ten plik zawiera zwięzłe informacje o projekcie oraz instrukcje developerskie. Przeznaczony jest jako pomoc dla członków zespołu oraz asystentów (np. Claude) — opisuje architekturę, uruchamianie środowiska deweloperskiego, API i podstawowe wskazówki debuggingowe.

## Opis projektu
S3 Deck to desktopowa aplikacja (Tauri + React) z prostym backendem w Go, która pozwala na przeglądanie zawartości bucketów S3 (oraz kompatybilnych endpointów). Interfejs użytkownika jest napisany w React + Tailwind, opakowany w Tauri; backend Go dostarcza proste API do listowania bucketów i obiektów oraz do zapisu konfiguracji połączeń.

Główne komponenty:
- Frontend: `src/` (React + Vite)
- Tauri: `src-tauri/` (Rust + konfiguracja Tauri)
- Go backend: `src-tauri/go-backend/` — prosty HTTP server obsługujący `/buckets`, `/objects`, `/add-bucket`
- Konfiguracja aplikacji użytkownika: `~/.s3deck/config.json`

## Szybkie uruchomienie (development)
Najprostszy sposób:
- Uruchom w repozytorium:
  - `./dev.sh` (skrypt startowy, uruchamia wszystkie potrzebne procesy)
  - lub `npm run start` (mapuje się na `./dev.sh`)

Alternatywy:
- Backend Go (hot-reload z `air`): `npm run dev:backend` — uruchamia w `src-tauri/go-backend`
- Frontend (Vite): `npm run dev`
- Tauri (dev): `npm run dev:tauri`
- Wszystko razem (concurrently): `npm run dev:all`

Uwaga: przed uruchomieniem backendu ręcznie możesz wykonać:
- `cd src-tauri/go-backend && go mod tidy`
- Zbudować: `cd src-tauri/go-backend && go build -o go-s3-browser main.go`

## Skrypty npm
- `npm run dev` — uruchamia Vite (frontend)
- `npm run build` — buduje frontend
- `npm run preview` — podgląd builda
- `npm run tauri` — uruchamia CLI Tauri
- `npm run dev:backend` — uruchamia Go backend z `air`
- `npm run dev:tauri` — `tauri dev`
- `npm run dev:all` — odpala backend + tauri w jednym terminalu (używa `concurrently`)
- `npm run start` — alias do `./dev.sh`

## Backend — API i konfiguracja
Backend Go nasłuchuje na porcie `8082` (domyślnie) i udostępnia:
- `GET /buckets` — zwraca listę skonfigurowanych bucketów (plik konfiguracyjny)
- `GET /objects?bucket=<bucketId>&prefix=<prefix>` — zwraca listę obiektów i folderów w podanym prefiksie
- `POST /add-bucket` — dodaje konfigurację bucketu (JSON)

Format konfiguracji (przykład):
{
  "buckets": [
    {
      "id": "abcd1234",
      "name": "bucket-name",
      "displayName": "Moje S3",
      "region": "us-east-1",
      "accessKey": "AKIA...",
      "secretKey": "....",
      "endpoint": "https://s3.example.com" // opcjonalne
    }
  ]
}

Plik konfiguracyjny jest zapisany w katalogu domowym użytkownika:
- `~/.s3deck/config.json`

Uwaga bezpieczeństwa: `accessKey` i `secretKey` są przechowywane w tym pliku w formie zwykłego tekstu. Dla produkcji rozważ szyfrowanie lub wykorzystanie systemowego store'а haseł.

## Frontend — istotne informacje
- Adresy do backendu są "hardcoded" do `http://localhost:8082` w kodzie (np. `src/App.jsx`) — podczas developmentu upewnij się, że backend działa na tym porcie.
- Aplikacja używa Vite + React + Tailwind. Pliki UI znajdują się w `src/components/`.

## Budowanie i wydanie
- Zbuduj frontend: `npm run build`
- Zbuduj i przygotuj Tauri/desktop packaging zgodnie z dokumentacją Tauri (`tauri build`) — wymagane są zainstalowane toolchainy Rust i Tauri CLI.
- Backend Go można skompilować `cd src-tauri/go-backend && go build -o go-s3-browser main.go` i dołączyć jako binarkę do pakietu, jeśli chcesz dystrybuować jako część aplikacji.

## Debugging i najczęstsze problemy
- Backend nie startuje:
  - Sprawdź `go mod tidy` w `src-tauri/go-backend`
  - Uruchom ręcznie `air` lub `go run main.go`
- Port 8082 zajęty:
  - `lsof -ti:8082 | xargs kill -9` lub `lsof -i :8082`
- Brak `air`:
  - `go install github.com/cosmtrek/air@latest` (lub zgodne z wymaganiami projektu)
- Problemy z Tauri:
  - Upewnij się, że masz zainstalowany Rust (stable), `cargo` i `@tauri-apps/cli`

## Testy i rozwój funkcji
- Dodając nowe endpointy backend, pamiętaj o:
  - Aktualizacji typów JSON w frontendzie
  - Obsłudze CORS (backend ustawia `Access-Control-Allow-Origin: *` dla prostoty)
- Przy modyfikacji konfiguracji/bucketów — backend zapisuje do `~/.s3deck/config.json`. Testuj operacje dodawania/usuwania lokalnie.

## Bezpieczeństwo
- Klucze dostępu S3 są wrażliwe — nie committuj ich do repozytorium.
- Jeśli planujesz udostępniać buildy z prekonfigurowanymi danymi, użyj bezpiecznego mechanizmu przechowywania sekretów.

## Dodatkowe wskazówki dla developera
- Pliki istotne do szybkiego przeglądu:
  - `src/App.jsx` — główny komponent aplikacji frontendu
  - `src-tauri/go-backend/main.go` — cały backend HTTP
  - `src/components/*` — komponenty UI
  - `src-tauri/Cargo.toml` — konfiguracja Tauri (Rust)
- Jeśli pracujesz nad UI używaj `npm run dev`, jeśli chcesz testować integrację z backendem i Tauri — `npm run dev:all` lub `./dev.sh`.
