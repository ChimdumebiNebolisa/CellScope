/**
 * Shared data contract for the CellScope analysis API.
 * These types match the backend request/response shapes so the frontend can build against them without guessing.
 * See docs/CONTRACT.md for full documentation.
 */

/** A single measured battery reading. All fields are required. */
export interface BatteryReading {
  timestamp: string; // ISO 8601 or parseable datetime
  voltage: number; // volts
  current: number; // amperes
  temperature: number; // celsius
}

/** Payload sent to the analysis API. */
export interface AnalysisRequest {
  readings: BatteryReading[];
}

/** Aggregate metrics computed from the dataset. */
export interface SummaryMetrics {
  totalReadings: number;
  averageVoltage: number;
  averageCurrent: number;
  peakTemperature: number;
  minVoltage: number;
  maxVoltage: number;
}

/** Severity of a threshold alert. */
export type AlertSeverity = "warning" | "critical";

/** A single threshold violation (over-temperature, under-voltage, over-current). */
export interface Alert {
  type: string; // e.g. "over_temperature", "under_voltage", "over_current"
  timestamp: string;
  value: number;
  severity: AlertSeverity;
  message: string; // human-readable explanation
}

/** A detected anomaly such as a sudden voltage drop. */
export interface Anomaly {
  type: string; // e.g. "voltage_drop"
  timestamp: string;
  value?: number;
  message: string;
}

/** A single point in a time-series chart. */
export interface ChartPoint {
  timestamp: string;
  value: number;
}

/** A labeled time series for dashboard charts. */
export interface ChartSeries {
  label: string; // e.g. "voltage", "current", "temperature", "voltage_smoothed"
  dataPoints: ChartPoint[];
}

/** Overall health classification of the dataset. */
export type HealthStatus = "Stable" | "Warning" | "Critical";

/** Overall health result for the dataset. */
export interface HealthResult {
  status: HealthStatus;
}

/** Full response from the analysis API. Consumed directly by dashboard and export. */
export interface AnalysisResponse {
  summary: SummaryMetrics;
  alerts: Alert[];
  anomalies: Anomaly[];
  chartSeries: ChartSeries[];
  health: HealthResult;
}
