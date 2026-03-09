# CellScope

Battery diagnostics tool: analyze measured battery data via CSV upload or manual entry. Get summary metrics, threshold alerts, anomaly detection, and health classification with no account required.

## Project structure

- **frontend/** — Next.js + TypeScript (CSV upload, manual entry, dashboard, export, optional local save)
- **backend/** — Go REST API (validation, metrics, alerts, anomalies, health classification)

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

Backend listens on **http://localhost:8080** and exposes `/health` and `POST /api/analyze`.

**Terminal 2 — Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3000** and uses `http://localhost:8080` for the API by default. Override with `frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:8080`

## Verify the full flow

1. Open http://localhost:3000. Confirm "Backend connection" shows ✓ when the backend is running.
2. **Input:** Upload a CSV (columns: `timestamp`, `voltage`, `current`, `temperature`) or use **Load sample dataset** to run the built-in demo CSV.
3. **Results:** Health summary, alerts, charts, and anomalies appear below.
4. **Export:** Use "Export JSON summary" and "Export anomalies CSV" when results are present.
5. **Optional:** Save the current dataset and results under "Saved locally" and load or delete sessions later.

A sample CSV is at `frontend/public/sample-battery-data.csv` and is used by the "Load sample dataset" button.

## Key technical decisions

| Decision | Context | Alternatives | Reason | Trade-offs |
|----------|---------|--------------|--------|------------|
| Next.js frontend + Go backend | Clear separation of UI and analysis. | Single stack (e.g. all Node), or Go-only with templating. | Keeps analysis logic in one place; frontend stays thin and calls API only. | Two runtimes to run locally; CORS/API contract must be kept in sync. |
| Rule-based health classification | Spec requires Stable / Warning / Critical without ML. | ML or heuristic scoring. | Predictable, testable, and easy to explain. | Less adaptive than learned models. |
| No server-side persistence | Spec: no accounts; datasets are request-scoped. | DB or file storage on server. | Simpler deployment and no PII storage. | Users cannot resume across devices. |
| Optional IndexedDB in browser | Spec allows optional local save. | No persistence; or server-side only. | Users can save/load in same browser without accounts. | Data is device-specific and can be cleared with site data. |
| Request-scoped, in-memory analysis | Each POST /api/analyze is independent. | Queues, caching, or stored state. | No global state; easy to reason about and scale horizontally. | Every analysis recomputes from scratch. |

## License

See repository.
