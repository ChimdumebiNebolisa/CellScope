// Package contract defines the shared request/response shapes for the CellScope analysis API.
// These types are the single source of truth for the data contract between frontend and backend.
package contract

// BatteryReading is a single measured reading from a battery.
// All fields are required for a valid reading.
type BatteryReading struct {
	Timestamp   string  `json:"timestamp"`   // ISO 8601 or parseable datetime string
	Voltage     float64 `json:"voltage"`     // volts
	Current     float64 `json:"current"`     // amperes
	Temperature float64 `json:"temperature"` // celsius
}

// AnalysisRequest is the payload sent to the analysis API.
type AnalysisRequest struct {
	Readings []BatteryReading `json:"readings"`
}

// SummaryMetrics holds aggregate metrics computed from the dataset.
type SummaryMetrics struct {
	TotalReadings   int     `json:"totalReadings"`
	AverageVoltage  float64 `json:"averageVoltage"`
	AverageCurrent  float64 `json:"averageCurrent"`
	PeakTemperature float64 `json:"peakTemperature"`
	MinVoltage      float64 `json:"minVoltage"`
	MaxVoltage      float64 `json:"maxVoltage"`
}

// AlertSeverity is the severity of a threshold alert.
type AlertSeverity string

const (
	AlertSeverityWarning AlertSeverity = "warning"
	AlertSeverityCritical AlertSeverity = "critical"
)

// Alert represents a single threshold violation (over-temperature, under-voltage, over-current).
type Alert struct {
	Type      string       `json:"type"`      // e.g. "over_temperature", "under_voltage", "over_current"
	Timestamp string       `json:"timestamp"`
	Value     float64      `json:"value"`
	Severity  AlertSeverity `json:"severity"`
	Message   string       `json:"message"`  // human-readable explanation
}

// Anomaly represents a detected anomaly such as a sudden voltage drop.
type Anomaly struct {
	Type      string  `json:"type"`      // e.g. "voltage_drop"
	Timestamp string  `json:"timestamp"` // time of the anomaly
	Value     float64 `json:"value,omitempty"`
	Message   string  `json:"message"`  // human-readable explanation
}

// ChartPoint is a single point in a time-series chart.
type ChartPoint struct {
	Timestamp string  `json:"timestamp"`
	Value     float64 `json:"value"`
}

// ChartSeries is a labeled time series for dashboard charts (voltage, current, temperature, or smoothed).
type ChartSeries struct {
	Label      string       `json:"label"`      // e.g. "voltage", "current", "temperature", "voltage_smoothed"
	DataPoints []ChartPoint `json:"dataPoints"`
}

// HealthStatus is the overall classification of the dataset.
type HealthStatus string

const (
	HealthStable   HealthStatus = "Stable"
	HealthWarning  HealthStatus = "Warning"
	HealthCritical HealthStatus = "Critical"
)

// HealthResult is the overall health classification for the dataset.
type HealthResult struct {
	Status HealthStatus `json:"status"`
}

// AnalysisResponse is the full response returned by the analysis API.
// It is designed for direct consumption by the frontend (dashboard and export).
type AnalysisResponse struct {
	Summary    SummaryMetrics `json:"summary"`
	Alerts     []Alert        `json:"alerts"`
	Anomalies  []Anomaly      `json:"anomalies"`
	ChartSeries []ChartSeries `json:"chartSeries"`
	Health     HealthResult   `json:"health"`
}
