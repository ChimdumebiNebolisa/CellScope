# MILESTONES.md

## Milestone 1: Core project foundation

**Goal:** Set up the frontend/backend structure, lock the data contracts, and create the base analysis request flow.

### Checkpoint 1.1: Project scaffolding is ready

- [x] Create the Next.js frontend project
- [x] Create the Go backend project
- [x] Set up the basic folder structure for frontend and backend
- [x] Add a simple local run workflow for both apps
- [x] Confirm the frontend can call the backend successfully

**Done means:** both apps run locally, and the frontend can hit a backend endpoint without errors.

### Checkpoint 1.2: Shared data contract is defined

- [ ] Define the battery reading shape with `timestamp`, `voltage`, `current`, and `temperature`
- [ ] Define the analysis request payload shape
- [ ] Define the analysis response shape
- [ ] Define alert, anomaly, summary metric, and chart series structures
- [ ] Document the request/response contract clearly in the repo

**Done means:** input and output formats are clear enough to build against without guessing.

### Checkpoint 1.3: Basic analysis route exists

- [ ] Add an analysis API route in the Go backend
- [ ] Accept a dataset payload from the frontend
- [ ] Return a placeholder structured response
- [ ] Handle basic request errors cleanly

**Done means:** the main analysis route exists end to end, even before full logic is added.

---

## Milestone 2: Validation and analysis engine

**Goal:** Build the core backend logic that turns raw battery readings into structured diagnostics.

### Checkpoint 2.1: Validation and normalization work

- [ ] Validate required fields for every reading
- [ ] Validate numeric fields
- [ ] Reject malformed or incomplete rows
- [ ] Normalize parsed data into one internal format
- [ ] Return clear validation errors

**Done means:** invalid datasets are rejected safely, and valid datasets enter analysis in a clean format.

### Checkpoint 2.2: Summary metrics are implemented

- [ ] Compute total readings
- [ ] Compute average voltage
- [ ] Compute average current
- [ ] Compute peak temperature
- [ ] Compute minimum voltage
- [ ] Compute maximum voltage

**Done means:** the backend returns all required summary metrics correctly for valid datasets.

### Checkpoint 2.3: Threshold alert detection is implemented

- [ ] Add over-temperature checks
- [ ] Add under-voltage checks
- [ ] Add over-current checks
- [ ] Attach timestamp, value, severity, and explanation to each alert
- [ ] Return alerts in a structured list

**Done means:** threshold-based issues are detected and returned in a usable format.

### Checkpoint 2.4: Smoothing and anomaly detection are implemented

- [ ] Add moving average smoothing for voltage
- [ ] Add moving average smoothing for current
- [ ] Add moving average smoothing for temperature
- [ ] Add sudden voltage drop detection
- [ ] Return anomaly markers in the response

**Done means:** the backend can produce smoothed series and detect abnormal voltage drops.

### Checkpoint 2.5: Health classification is implemented

- [ ] Define simple rule-based classification logic
- [ ] Add `Stable` classification behavior
- [ ] Add `Warning` classification behavior
- [ ] Add `Critical` classification behavior
- [ ] Include overall health status in the response

**Done means:** every valid dataset receives a final overall health result.

---

## Milestone 3: User input flows

**Goal:** Let users provide battery data through CSV upload or manual entry and send it for analysis.

### Checkpoint 3.1: CSV upload flow works

- [ ] Add CSV file upload UI
- [ ] Parse CSV data in the frontend or backend as planned
- [ ] Validate required CSV columns
- [ ] Show useful errors for bad CSV files
- [ ] Submit parsed readings to the analysis API

**Done means:** a user can upload a valid CSV and get analysis results.

### Checkpoint 3.2: Manual entry flow works

- [ ] Build an editable readings table
- [ ] Allow adding rows
- [ ] Allow editing rows
- [ ] Allow deleting rows
- [ ] Submit manual entries to the analysis API

**Done means:** a user can manually build a dataset and analyze it without uploading a file.

### Checkpoint 3.3: Input UX is usable

- [ ] Add loading states during analysis
- [ ] Add empty-state guidance
- [ ] Add input-level validation messages
- [ ] Prevent broken or duplicate submissions
- [ ] Make it clear which fields are required

**Done means:** the input experience is understandable and not fragile.

---

## Milestone 4: Results dashboard and export

**Goal:** Present analysis results clearly through summary cards, alerts, charts, and exports.

### Checkpoint 4.1: Health summary is visible

- [ ] Show overall health classification
- [ ] Show total readings
- [ ] Show alert count
- [ ] Show average voltage
- [ ] Show peak temperature

**Done means:** users can understand the dataset status at a glance.

### Checkpoint 4.2: Alerts and anomalies are visible

- [ ] Render the alerts panel
- [ ] Display alert type
- [ ] Display timestamp
- [ ] Display value
- [ ] Display severity and explanation
- [ ] Render anomaly markers or anomaly list

**Done means:** detected problems are visible and easy to inspect.

### Checkpoint 4.3: Charts are implemented

- [ ] Add voltage-over-time chart
- [ ] Add current-over-time chart
- [ ] Add temperature-over-time chart
- [ ] Show smoothed series where useful
- [ ] Show anomaly markers on charts if supported cleanly

**Done means:** the dashboard shows readable time-series views of the data.

### Checkpoint 4.4: Export works

- [ ] Add JSON summary export
- [ ] Add anomaly CSV export
- [ ] Make sure export data matches the displayed results
- [ ] Handle export when no results are present

**Done means:** users can export the analysis summary and flagged anomalies successfully.

---

## Milestone 5: Local persistence and polish

**Goal:** Add optional local save/load and tighten the product for a clean v1 release.

### Checkpoint 5.1: Optional local persistence works

- [ ] Add IndexedDB setup in the frontend
- [ ] Save datasets locally
- [ ] Save analysis results locally if needed
- [ ] Add load-from-local flow
- [ ] Add delete-from-local flow

**Done means:** users can optionally save and reload their work in the same browser without accounts.

### Checkpoint 5.2: Error handling and edge cases are covered

- [ ] Handle empty datasets safely
- [ ] Handle single-row datasets safely
- [ ] Handle malformed timestamps safely
- [ ] Handle large but reasonable datasets without breaking UI flow
- [ ] Confirm server-side analysis remains request-scoped and in memory only

**Done means:** the app behaves predictably across normal edge cases.

### Checkpoint 5.3: Release readiness

- [ ] Review the UI for clarity and consistency
- [ ] Remove obvious dead code and placeholders
- [ ] Make sure README reflects the real project state
- [ ] Add a short sample dataset for testing/demo
- [ ] Verify the full flow from input to dashboard to export

**Done means:** the project is clean, demoable, and aligned with the actual implemented scope.

---

## Final completion check

CellScope v1 is complete when all of the following are true:

- [ ] CSV upload works
- [ ] Manual entry works
- [ ] Validation works
- [ ] Summary metrics are correct
- [ ] Threshold alerts work
- [ ] Voltage drop anomaly detection works
- [ ] Health classification works
- [ ] Dashboard renders summary, alerts, and charts
- [ ] Export works
- [ ] No accounts are required
- [ ] No server-side dataset persistence is used
- [ ] Optional local browser save works