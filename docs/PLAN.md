# PLAN.md

## Build Strategy

CellScope will be built as a simple web application with a clear frontend/backend split.

The frontend will handle user interaction, data entry, file upload, result display, optional local persistence, and exports. The backend will handle all analysis logic, including validation, normalization, metric computation, alert detection, anomaly detection, and health classification.

The overall approach is:

**browser UI -> REST API -> in-memory analysis engine -> structured diagnostic response**

This keeps the product focused, easy to reason about, and aligned with the project goal of analyzing measured battery data rather than simulating behavior.

## Chosen Architecture

### Frontend

A Next.js + TypeScript frontend will provide:

- CSV upload flow
- manual entry table
- analysis trigger
- results dashboard
- optional local save/load
- export controls

The frontend should stay thin. It should collect input, call the backend, and render the returned results without re-implementing the analysis logic.

### Backend

A Go backend exposed through a REST API will provide:

- CSV and payload parsing
- schema validation
- numeric validation
- normalization of input data
- summary metric computation
- threshold alert detection
- moving average smoothing
- abnormal voltage drop detection
- rule-based health classification
- chart-ready response formatting

The backend should process each analysis request entirely in memory and return the result immediately. It should not persist uploaded datasets on the server.

## Major Components

### 1. Input Layer

This covers the two supported data-entry paths:

- CSV upload
- manual row entry

Its job is to make sure the user can provide battery readings in a consistent shape before analysis.

### 2. Validation and Normalization Layer

This lives in the backend and is responsible for:

- checking required fields
- rejecting malformed rows
- confirming numeric values are valid
- converting the input into a normalized internal format

This layer protects the rest of the system from bad input.

### 3. Analysis Engine

This is the core of the product. It performs:

- summary metric computation
- threshold checks
- smoothing
- anomaly detection
- overall health classification

This should be implemented as a set of small, focused analysis modules inside the Go backend rather than one large monolithic function.

### 4. Response Shaping Layer

After analysis, the backend should return a structured response designed for direct frontend use.

This response should include:

- summary metrics
- alert records
- anomaly records
- chart series
- overall health result

The frontend should not need to derive important analysis results on its own.

### 5. Dashboard Layer

This is the main result surface in the frontend. It should render:

- a health summary card
- alerts panel
- time-series charts
- anomaly markers where relevant
- export actions

### 6. Local Persistence Layer

Optional browser-local persistence will be handled in the frontend using IndexedDB.

This should be treated as a convenience feature, not a core dependency of the analysis flow. The product must still work fully without saved local data.

## Technologies

### Frontend

- Next.js
- TypeScript
- React
- a lightweight charting library for time-series visualization
- IndexedDB for optional browser-local persistence

### Backend

- Go
- REST API
- standard library first where practical

### Data Format

The system will use a simple structured reading format with these fields:

- timestamp
- voltage
- current
- temperature

## How the Main Pieces Connect

### Input to Analysis

The user either uploads a CSV or enters rows manually in the frontend.

The frontend converts that input into a request payload and sends it to the Go API.

### Analysis to Output

The backend validates and analyzes the data, then returns a structured response containing:

- clean summary values
- alert events
- anomaly information
- chart-ready series
- health classification

The frontend then renders that response into the dashboard.

### Optional Local Save

If local save is enabled, the frontend stores datasets and/or results in IndexedDB. This remains separate from the backend and does not affect server-side processing.

## API Shape

The API should stay minimal.

A simple initial design is enough:

- one analysis endpoint for submitted battery datasets
- one response format for dashboard rendering and export generation

This avoids unnecessary route sprawl and keeps the system easy to maintain.

## High-Level Implementation Order

### 1. Define the data contract

Start by locking the request and response shapes for battery readings, analysis results, alerts, anomalies, and chart series.

### 2. Build the backend analysis path

Implement the Go backend first for:

- validation
- normalization
- metrics
- alerts
- anomalies
- health classification

This establishes the product’s core value early.

### 3. Build the frontend input flows

Add CSV upload and manual entry so the frontend can submit valid datasets to the backend.

### 4. Build the results dashboard

Render the backend response through summary cards, alert views, and charts.

### 5. Add export support

Support exporting the JSON summary and anomaly CSV after the analysis pipeline is stable.

### 6. Add optional local persistence

Add IndexedDB save/load only after the core analysis and dashboard flow is already working.

### 7. Polish and harden

Refine validation feedback, chart readability, empty states, and error handling.

## Risks

### Input quality risk

CSV files and manual input can be messy. If validation is weak, downstream analysis becomes unreliable.

### Scope creep risk

It would be easy for this project to drift into simulation, prediction, cloud accounts, or real-time streaming. That would dilute the core product.

### UI complexity risk

Manual entry tables, chart rendering, alerts, anomalies, and exports can make the frontend heavier than needed if not kept focused.

### Response-shape mismatch risk

If the backend response is not designed well, the frontend will end up doing unnecessary transformation work and become harder to maintain.

### Local persistence risk

IndexedDB can add complexity around saved versions, stale local data, and edge-case UI handling. It should remain optional and isolated.

## Trade-Offs

### Frontend/backend split vs single-process simplicity

Using Next.js on the frontend and Go on the backend gives a clearer technical separation and stronger engineering story, but it increases project setup complexity compared to doing everything in one stack.

### Rule-based analysis vs ML-based prediction

Rule-based analysis is easier to explain, test, and control. It is less sophisticated than predictive models, but it fits the project scope much better.

### No server persistence vs richer user history

Avoiding server-side storage keeps privacy concerns and infrastructure complexity lower, but it means users do not get cloud history or cross-device sync.

### Thin frontend vs richer client logic

Keeping analysis on the backend reduces duplication and keeps the frontend simpler, but it means the frontend depends on the backend being available for full functionality.

## Assumptions

- The product is intended for browser use, not native desktop use.
- Users will analyze one dataset at a time in the initial version.
- The backend can process expected datasets in memory without requiring queueing or background jobs.
- Initial health classification will be rule-based, not predictive.
- Optional persistence is local to the browser only.
- The first version prioritizes clarity and correctness over advanced features.

## Out of Scope for This Plan

The following are intentionally not part of the build strategy for the initial version:

- battery simulation
- battery chemistry modeling
- real-time device streaming
- user accounts
- cloud-synced history
- machine learning predictions
- full battery management workflows

## Final Direction

CellScope should be built as a focused diagnostics product with a thin web frontend and a Go analysis backend. The priority is to make the analysis path correct, understandable, and easy to use before adding convenience features. The architecture should stay simple, stateless on the server, and tightly aligned to the battery-data analysis use case.