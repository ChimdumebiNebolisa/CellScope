/**
 * Export helpers for analysis results.
 * JSON summary and anomaly CSV match the data shown in the dashboard.
 */

import type { AnalysisResponse, Anomaly } from "@/types/contract";

/** Summary payload for JSON export (matches displayed summary, alerts, anomalies). */
export interface JsonSummaryPayload {
  summary: AnalysisResponse["summary"];
  health: AnalysisResponse["health"];
  alerts: AnalysisResponse["alerts"];
  anomalies: AnalysisResponse["anomalies"];
  exportedAt: string; // ISO 8601
}

/**
 * Build the JSON summary object (same data as dashboard).
 * Excludes chart series to keep export focused on diagnostics.
 */
export function buildJsonSummary(data: AnalysisResponse): JsonSummaryPayload {
  return {
    summary: data.summary,
    health: data.health,
    alerts: data.alerts,
    anomalies: data.anomalies,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Trigger download of the analysis summary as a JSON file.
 */
export function downloadJsonSummary(data: AnalysisResponse, filename?: string): void {
  const payload = buildJsonSummary(data);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const name = filename ?? `cellscope-summary-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Build CSV string for anomalies (type, timestamp, value, message).
 * Escapes fields that may contain commas or quotes.
 */
export function buildAnomalyCsv(anomalies: Anomaly[]): string {
  const header = "type,timestamp,value,message";
  const escape = (s: string) => {
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const rows = anomalies.map((a) => {
    const value = a.value != null ? String(a.value) : "";
    return [a.type, a.timestamp, value, a.message].map(escape).join(",");
  });
  return [header, ...rows].join("\n");
}

/**
 * Trigger download of anomalies as a CSV file.
 */
export function downloadAnomalyCsv(anomalies: Anomaly[], filename?: string): void {
  const csv = buildAnomalyCsv(anomalies);
  const blob = new Blob([csv], { type: "text/csv" });
  const name =
    filename ?? `cellscope-anomalies-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
