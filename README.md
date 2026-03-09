# CellScope

Battery diagnostics tool: analyze measured battery data via CSV upload or manual entry.

## Project structure

- **frontend/** — Next.js + TypeScript app (UI, upload, manual entry, dashboard)
- **backend/** — Go REST API (validation, analysis, health classification)

## Run locally

**Prerequisites:** Node.js, npm, and Go installed.

### Option A: Run both from root

```bash
npm install
cd frontend && npm install && cd ..
npm run dev
```

This starts the Go backend (port 8080) and Next.js frontend (port 3000) together.

### Option B: Run in separate terminals

**Terminal 1 — Backend:**

```bash
cd backend
go run ./cmd/server
```

Backend listens on **http://localhost:8080** (or set `PORT` for another port) and exposes `/health` and `POST /api/analyze`.

**Terminal 2 — Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3000** and calls the backend at `http://localhost:8080` by default.

Optional: create `frontend/.env.local` with:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

(Defaults to this URL if unset.)

### Verify

Open http://localhost:3000. The page should show “Backend connection” and “✓ CellScope backend is running” when the backend is up. Use “Test analyze (POST /api/analyze)” to confirm the analysis route.

To verify milestones 1.1–1.3 from the repo root (PowerShell): `.\scripts\verify-milestone-1.ps1`

## Checkpoint 1.1

- [x] Next.js frontend project
- [x] Go backend project
- [x] Basic folder structure (frontend/, backend/cmd/server, backend/internal)
- [x] Local run workflow (run backend then frontend; frontend calls backend)
- [x] Frontend can call backend successfully (/health)
