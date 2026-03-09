"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { AnalysisResponse } from "@/types/contract";
import { parseBatteryCsv } from "@/lib/csv";
import { downloadJsonSummary, downloadAnomalyCsv } from "@/lib/export";
import {
  listSessions,
  saveSession,
  getSession,
  deleteSession,
  type SessionMeta,
} from "@/lib/persistence";

const TimeSeriesCharts = dynamic(
  () => import("@/components/TimeSeriesCharts").then((m) => m.TimeSeriesCharts),
  { ssr: false }
);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/** Cap manual entry rows so the UI stays responsive. */
const MAX_MANUAL_ROWS = 2000;

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<{
    ok: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const [analyzeResult, setAnalyzeResult] = useState<{
    ok: boolean;
    data?: AnalysisResponse;
    error?: string;
  } | null>(null);

  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvDetails, setCsvDetails] = useState<string[] | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manualValidationErrors, setManualValidationErrors] = useState<string[] | null>(null);

  type ManualRow = { id: string; timestamp: string; voltage: string; current: string; temperature: string };
  const [manualRows, setManualRows] = useState<ManualRow[]>(() => [
    { id: crypto.randomUUID(), timestamp: "", voltage: "", current: "", temperature: "" },
  ]);

  const [savedSessions, setSavedSessions] = useState<SessionMeta[] | null>(null);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);
  const [saveName, setSaveName] = useState("");

  const addManualRow = () => {
    setManualValidationErrors(null);
    setManualRows((prev) => {
      if (prev.length >= MAX_MANUAL_ROWS) return prev;
      return [
        ...prev,
        { id: crypto.randomUUID(), timestamp: "", voltage: "", current: "", temperature: "" },
      ];
    });
  };

  const deleteManualRow = (id: string) => {
    setManualRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const updateManualRow = (id: string, field: keyof ManualRow, value: string) => {
    if (field === "id") return;
    setManualValidationErrors(null);
    setManualRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  function validateManualRows(): string[] {
    const errs: string[] = [];
    manualRows.forEach((r, i) => {
      const rowNum = i + 1;
      const hasTimestamp = r.timestamp.trim() !== "";
      const v = Number(r.voltage);
      const c = Number(r.current);
      const t = Number(r.temperature);
      const validNum = (x: number) => !Number.isNaN(x) && Number.isFinite(x);
      const hasVoltage = r.voltage !== "" && validNum(v);
      const hasCurrent = r.current !== "" && validNum(c);
      const hasTemp = r.temperature !== "" && validNum(t);
      if (!hasTimestamp || !hasVoltage || !hasCurrent || !hasTemp) {
        errs.push(`Row ${rowNum}: all fields required (timestamp, voltage, current, temperature as numbers).`);
      }
    });
    return errs;
  }

  const submitManualEntries = () => {
    setManualValidationErrors(null);
    const errs = validateManualRows();
    if (errs.length > 0) {
      setManualValidationErrors(errs);
      return;
    }
    const readings = manualRows.map((r) => ({
      timestamp: r.timestamp.trim(),
      voltage: Number(r.voltage) || 0,
      current: Number(r.current) || 0,
      temperature: Number(r.temperature) || 0,
    }));
    const validReadings = readings.filter(
      (r) =>
        r.timestamp !== "" &&
        Number.isFinite(r.voltage) &&
        Number.isFinite(r.current) &&
        Number.isFinite(r.temperature)
    );
    if (validReadings.length === 0) {
      setManualValidationErrors(["Add at least one complete row (all fields required) before analyzing."]);
      return;
    }
    submitReadings(validReadings);
  };

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error(`HTTP ${res.status}`);
      })
      .then((data) => setBackendStatus({ ok: true, message: data.message }))
      .catch((err) =>
        setBackendStatus({
          ok: false,
          error: err instanceof Error ? err.message : "Request failed",
        })
      );
  }, []);

  function refreshSavedList() {
    setPersistenceError(null);
    listSessions()
      .then(setSavedSessions)
      .catch((err) =>
        setPersistenceError(err instanceof Error ? err.message : "Could not list saved sessions")
      );
  }

  useEffect(() => {
    refreshSavedList();
  }, []);

  function getCurrentReadings(): { timestamp: string; voltage: number; current: number; temperature: number }[] {
    const validNum = (x: number) => !Number.isNaN(x) && Number.isFinite(x);
    return manualRows
      .filter(
        (r) =>
          r.timestamp.trim() !== "" &&
          r.voltage !== "" &&
          validNum(Number(r.voltage)) &&
          r.current !== "" &&
          validNum(Number(r.current)) &&
          r.temperature !== "" &&
          validNum(Number(r.temperature))
      )
      .map((r) => ({
        timestamp: r.timestamp.trim(),
        voltage: Number(r.voltage) || 0,
        current: Number(r.current) || 0,
        temperature: Number(r.temperature) || 0,
      }));
  }

  function handleSave() {
    const readings = getCurrentReadings();
    if (readings.length === 0) {
      setManualValidationErrors(["Add at least one complete row (all fields valid) to save."]);
      return;
    }
    setManualValidationErrors(null);
    setPersistenceError(null);
    const result = analyzeResult?.ok && analyzeResult?.data ? analyzeResult.data : null;
    saveSession(saveName.trim() || `Session ${new Date().toLocaleString()}`, readings, result)
      .then(() => {
        setSaveName("");
        refreshSavedList();
      })
      .catch((err) =>
        setPersistenceError(err instanceof Error ? err.message : "Save failed")
      );
  }

  function handleLoad(id: string) {
    setPersistenceError(null);
    getSession(id)
      .then((session) => {
        if (!session) return;
        const rows: ManualRow[] =
          session.readings.length === 0
            ? [{ id: crypto.randomUUID(), timestamp: "", voltage: "", current: "", temperature: "" }]
            : session.readings.map((r) => ({
                id: crypto.randomUUID(),
                timestamp: r.timestamp,
                voltage: String(r.voltage),
                current: String(r.current),
                temperature: String(r.temperature),
              }));
        setManualRows(rows);
        setAnalyzeResult(
          session.result ? { ok: true, data: session.result } : null
        );
        setCsvError(null);
        setCsvDetails(null);
      })
      .catch((err) =>
        setPersistenceError(err instanceof Error ? err.message : "Load failed")
      );
  }

  function handleDelete(id: string) {
    setPersistenceError(null);
    deleteSession(id)
      .then(refreshSavedList)
      .catch((err) =>
        setPersistenceError(err instanceof Error ? err.message : "Delete failed")
      );
  }

  const submitReadings = (readings: { timestamp: string; voltage: number; current: number; temperature: number }[]) => {
    setAnalyzeResult(null);
    setCsvError(null);
    setCsvDetails(null);
    setManualValidationErrors(null);
    setIsAnalyzing(true);
    fetch(`${API_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readings }),
    })
      .then(async (res) => {
        const text = await res.text();
        let data: unknown;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          const snippet = text.slice(0, 80).replace(/\s+/g, " ");
          throw new Error(
            `Server did not return valid JSON. Is the backend at ${API_URL} running? Response: ${snippet}${text.length > 80 ? "…" : ""}`
          );
        }
        if (!res.ok) {
          const msg = (data as { error?: string; details?: string[] })?.error ?? `HTTP ${res.status}`;
          const details = (data as { details?: string[] })?.details;
          throw new Error(details?.length ? `${msg}: ${details.join("; ")}` : msg);
        }
        return data as AnalysisResponse;
      })
      .then((data) => {
        setAnalyzeResult({ ok: true, data });
        setIsAnalyzing(false);
      })
      .catch((err) => {
        setAnalyzeResult({
          ok: false,
          error: err instanceof Error ? err.message : "Request failed",
        });
        setIsAnalyzing(false);
      });
  };

  const loadSampleDataset = () => {
    setCsvError(null);
    setCsvDetails(null);
    setAnalyzeResult(null);
    fetch("/sample-battery-data.csv")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load sample");
        return res.text();
      })
      .then((text) => {
        const result = parseBatteryCsv(text);
        if (result.ok) {
          submitReadings(result.readings);
        } else {
          setCsvError(result.message);
          setCsvDetails(result.details ?? null);
        }
      })
      .catch(() => {
        setCsvError("Could not load sample dataset.");
      });
  };

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setCsvError(null);
    setCsvDetails(null);
    setAnalyzeResult(null);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const result = parseBatteryCsv(text);
      if (result.ok) {
        submitReadings(result.readings);
      } else {
        setCsvError(result.message);
        setCsvDetails(result.details ?? null);
      }
    };
    reader.onerror = () => {
      setCsvError("Could not read file.");
      setCsvDetails(null);
    };
    reader.readAsText(file);
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>CellScope</h1>
      <p>Battery diagnostics tool</p>
      <section style={{ marginTop: "1.5rem" }}>
        <h2>Backend connection</h2>
        {backendStatus === null && <p>Checking backend…</p>}
        {backendStatus?.ok && (
          <p style={{ color: "green" }}>✓ {backendStatus.message}</p>
        )}
        {backendStatus && !backendStatus.ok && (
          <p style={{ color: "red" }}>✗ {backendStatus.error}</p>
        )}
      </section>
      <section style={{ marginTop: "1.5rem" }}>
        <h2>CSV upload</h2>
        <p style={{ marginBottom: "0.5rem", color: "#666", fontSize: "14px" }}>
          Required columns: <code>timestamp</code>, <code>voltage</code>, <code>current</code>, <code>temperature</code>.
        </p>
        <input
          type="file"
          accept=".csv"
          onChange={handleCsvFile}
          disabled={backendStatus?.ok !== true || isAnalyzing}
          style={{ display: "block", marginTop: "0.25rem" }}
        />
        {csvError && (
          <div style={{ marginTop: "0.5rem" }}>
            <p style={{ color: "red" }}>✗ {csvError}</p>
            {csvDetails && csvDetails.length > 0 && (
              <ul style={{ color: "#c00", fontSize: "13px", marginTop: "0.25rem", paddingLeft: "1.25rem" }}>
                {csvDetails.slice(0, 10).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
                {csvDetails.length > 10 && <li>… and {csvDetails.length - 10} more</li>}
              </ul>
            )}
          </div>
        )}
      </section>
      <section style={{ marginTop: "1.5rem" }}>
        <h2>Manual entry</h2>
        <p style={{ marginBottom: "0.5rem", color: "#666", fontSize: "14px" }}>
          Add, edit, or delete rows below. All fields are required for each row. Then click Analyze.
        </p>
        {manualValidationErrors && manualValidationErrors.length > 0 && (
          <div style={{ marginBottom: "0.5rem" }}>
            <p style={{ color: "#c00", fontSize: "14px", marginBottom: "0.25rem" }}>Please fix before analyzing:</p>
            <ul style={{ color: "#c00", fontSize: "13px", margin: 0, paddingLeft: "1.25rem" }}>
              {manualValidationErrors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </div>
        )}
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", minWidth: "420px", fontSize: "14px" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "4px 6px", borderBottom: "1px solid #ccc" }}>Timestamp (required)</th>
                <th style={{ textAlign: "left", padding: "4px 6px", borderBottom: "1px solid #ccc" }}>Voltage (V, required)</th>
                <th style={{ textAlign: "left", padding: "4px 6px", borderBottom: "1px solid #ccc" }}>Current (A, required)</th>
                <th style={{ textAlign: "left", padding: "4px 6px", borderBottom: "1px solid #ccc" }}>Temperature (°C, required)</th>
                <th style={{ width: "48px", borderBottom: "1px solid #ccc" }} />
              </tr>
            </thead>
            <tbody>
              {manualRows.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: "2px 4px" }}>
                    <input
                      type="text"
                      value={row.timestamp}
                      onChange={(e) => updateManualRow(row.id, "timestamp", e.target.value)}
                      placeholder="e.g. 2025-03-09T10:00:00Z"
                      style={{ width: "100%", minWidth: "160px", boxSizing: "border-box" }}
                    />
                  </td>
                  <td style={{ padding: "2px 4px" }}>
                    <input
                      type="number"
                      step="any"
                      value={row.voltage}
                      onChange={(e) => updateManualRow(row.id, "voltage", e.target.value)}
                      placeholder="3.85"
                      style={{ width: "80px", boxSizing: "border-box" }}
                    />
                  </td>
                  <td style={{ padding: "2px 4px" }}>
                    <input
                      type="number"
                      step="any"
                      value={row.current}
                      onChange={(e) => updateManualRow(row.id, "current", e.target.value)}
                      placeholder="1.2"
                      style={{ width: "80px", boxSizing: "border-box" }}
                    />
                  </td>
                  <td style={{ padding: "2px 4px" }}>
                    <input
                      type="number"
                      step="any"
                      value={row.temperature}
                      onChange={(e) => updateManualRow(row.id, "temperature", e.target.value)}
                      placeholder="28"
                      style={{ width: "80px", boxSizing: "border-box" }}
                    />
                  </td>
                  <td style={{ padding: "2px 4px" }}>
                    <button
                      type="button"
                      onClick={() => deleteManualRow(row.id)}
                      disabled={manualRows.length <= 1}
                      title="Delete row"
                      style={{ padding: "2px 8px" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: "0.5rem", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={addManualRow}
            disabled={isAnalyzing || manualRows.length >= MAX_MANUAL_ROWS}
          >
            Add row
          </button>
          <button
            type="button"
            onClick={submitManualEntries}
            disabled={backendStatus?.ok !== true || isAnalyzing}
          >
            Analyze
          </button>
          {manualRows.length >= MAX_MANUAL_ROWS && (
            <span style={{ fontSize: "13px", color: "#666" }}>
              Maximum {MAX_MANUAL_ROWS} rows. Delete rows to add more.
            </span>
          )}
        </div>
      </section>
      <section style={{ marginTop: "1.5rem" }}>
        <h2>Saved locally</h2>
        <p style={{ marginBottom: "0.5rem", color: "#666", fontSize: "14px" }}>
          Save the current dataset (and analysis result if any) to this browser. No account required.
        </p>
        {persistenceError && (
          <p style={{ marginBottom: "0.5rem", color: "#c00", fontSize: "14px" }}>{persistenceError}</p>
        )}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "0.75rem" }}>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Session name (optional)"
            style={{ padding: "6px 8px", minWidth: "180px" }}
          />
          <button type="button" onClick={handleSave} style={{ padding: "6px 12px" }}>
            Save current
          </button>
        </div>
        <div
          style={{
            padding: "1rem",
            background: "#f8f9fa",
            borderRadius: "6px",
            border: "1px solid #e9ecef",
          }}
        >
          {savedSessions === null ? (
            <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>Loading saved sessions…</p>
          ) : savedSessions.length === 0 ? (
            <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>No saved sessions yet.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "14px" }}>
              {savedSessions.map((s) => (
                <li key={s.id} style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ flex: 1 }}>
                    <strong>{s.name}</strong>
                    <span style={{ color: "#666", fontSize: "12px", marginLeft: "6px" }}>
                      {new Date(s.savedAt).toLocaleString()}
                    </span>
                  </span>
                  <button type="button" onClick={() => handleLoad(s.id)} style={{ padding: "4px 8px" }}>
                    Load
                  </button>
                  <button type="button" onClick={() => handleDelete(s.id)} style={{ padding: "4px 8px" }}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <section style={{ marginTop: "1.5rem" }}>
        <h2>Analysis</h2>
        {isAnalyzing && (
          <p style={{ marginBottom: "0.5rem", color: "#666" }}>Analyzing…</p>
        )}
        <button type="button" onClick={loadSampleDataset} disabled={backendStatus?.ok !== true || isAnalyzing}>
          Load sample dataset
        </button>
        <span style={{ fontSize: "13px", color: "#666", marginLeft: "0.5rem" }}>
          Uses <a href="/sample-battery-data.csv" download="sample-battery-data.csv">sample-battery-data.csv</a> for demo.
        </span>
        {analyzeResult === null && !csvError && !isAnalyzing && (
          <p style={{ marginTop: "0.5rem", color: "#666" }}>
            Upload a CSV, fill the manual entry table (all fields required), or use the sample button. Results appear below.
          </p>
        )}
        {!isAnalyzing && !(analyzeResult?.ok && analyzeResult?.data) && (
          <p style={{ marginTop: "0.75rem", fontSize: "13px", color: "#666" }}>
            Export: Run analysis to enable export.
          </p>
        )}
        {analyzeResult?.ok && analyzeResult.data && (
          <>
            <section style={{ marginTop: "1rem" }}>
              <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>Health summary</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: "0.75rem",
                  padding: "1rem",
                  background: "#f8f9fa",
                  borderRadius: "6px",
                  border: "1px solid #e9ecef",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "2px" }}>Health</div>
                  <div
                    style={{
                      fontWeight: 600,
                      color:
                        analyzeResult.data.health.status === "Stable"
                          ? "#198754"
                          : analyzeResult.data.health.status === "Warning"
                            ? "#b8860b"
                            : "#dc3545",
                    }}
                  >
                    {analyzeResult.data.health.status}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "2px" }}>Total readings</div>
                  <div style={{ fontWeight: 600 }}>{analyzeResult.data.summary.totalReadings}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "2px" }}>Alert count</div>
                  <div style={{ fontWeight: 600 }}>{analyzeResult.data.alerts.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "2px" }}>Average voltage</div>
                  <div style={{ fontWeight: 600 }}>{analyzeResult.data.summary.averageVoltage.toFixed(2)} V</div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "2px" }}>Peak temperature</div>
                  <div style={{ fontWeight: 600 }}>{analyzeResult.data.summary.peakTemperature.toFixed(1)} °C</div>
                </div>
              </div>
            </section>
            <section style={{ marginTop: "1rem" }}>
              <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>Alerts</h3>
              <div
                style={{
                  padding: "1rem",
                  background: "#f8f9fa",
                  borderRadius: "6px",
                  border: "1px solid #e9ecef",
                }}
              >
                {analyzeResult.data.alerts.length === 0 ? (
                  <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>No alerts.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "14px" }}>
                    {analyzeResult.data.alerts.map((a, i) => (
                      <li key={i} style={{ marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: 600 }}>{a.type}</span>
                        {a.severity === "critical" ? (
                          <span style={{ marginLeft: "6px", color: "#dc3545", fontSize: "12px" }}>(critical)</span>
                        ) : (
                          <span style={{ marginLeft: "6px", color: "#b8860b", fontSize: "12px" }}>(warning)</span>
                        )}
                        {" — "}
                        <span style={{ color: "#495057" }}>{a.message}</span>
                        <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                          {a.timestamp} · value: {a.value}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
            <section style={{ marginTop: "1rem" }}>
              <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>Charts</h3>
              <div
                style={{
                  padding: "1rem",
                  background: "#f8f9fa",
                  borderRadius: "6px",
                  border: "1px solid #e9ecef",
                }}
              >
                <TimeSeriesCharts
                  chartSeries={analyzeResult.data.chartSeries}
                  anomalies={analyzeResult.data.anomalies}
                />
              </div>
            </section>
            <section style={{ marginTop: "1rem" }}>
              <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>Anomalies</h3>
              <div
                style={{
                  padding: "1rem",
                  background: "#f8f9fa",
                  borderRadius: "6px",
                  border: "1px solid #e9ecef",
                }}
              >
                {analyzeResult.data.anomalies.length === 0 ? (
                  <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>No anomalies detected.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "14px" }}>
                    {analyzeResult.data.anomalies.map((a, i) => (
                      <li key={i} style={{ marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: 600 }}>{a.type}</span>
                        {" — "}
                        <span style={{ color: "#495057" }}>{a.message}</span>
                        <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                          {a.timestamp}
                          {a.value != null && ` · value: ${a.value}`}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
            <section style={{ marginTop: "1rem" }}>
              <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>Export</h3>
              <div
                style={{
                  padding: "1rem",
                  background: "#f8f9fa",
                  borderRadius: "6px",
                  border: "1px solid #e9ecef",
                }}
              >
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => downloadJsonSummary(analyzeResult.data!)}
                    style={{ padding: "6px 12px" }}
                  >
                    Export JSON summary
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadAnomalyCsv(analyzeResult.data!.anomalies)}
                    style={{ padding: "6px 12px" }}
                  >
                    Export anomalies CSV
                  </button>
                </div>
                <p style={{ margin: "0.5rem 0 0", fontSize: "13px", color: "#666" }}>
                  JSON includes summary, health, alerts, and anomalies. CSV lists all flagged anomalies.
                </p>
              </div>
            </section>
          </>
        )}
        {analyzeResult && !analyzeResult.ok && (
          <p style={{ marginTop: "0.5rem", color: "red" }}>✗ {analyzeResult.error}</p>
        )}
      </section>
    </main>
  );
}
