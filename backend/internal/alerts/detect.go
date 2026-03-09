// Package alerts detects threshold violations in battery readings.
// Thresholds are defined here and are easy to locate and modify (see GUARDRAILS).
package alerts

import (
	"cellscope/backend/internal/contract"
	"fmt"
)

// Thresholds for alert detection. Adjust these for your use case.
const (
	// Over-temperature (°C): above TempWarning = warning, above TempCritical = critical.
	TempWarning  = 45.0
	TempCritical = 55.0

	// Under-voltage (V): below VoltageCritical = critical, below VoltageWarning = warning.
	VoltageWarning  = 3.0
	VoltageCritical = 2.8

	// Over-current (A): above CurrentWarning = warning, above CurrentCritical = critical.
	CurrentWarning  = 2.0
	CurrentCritical = 4.0
)

const (
	typeOverTemp     = "over_temperature"
	typeUnderVoltage = "under_voltage"
	typeOverCurrent  = "over_current"
)

// DetectAlerts scans readings and returns a list of threshold violations.
// Each alert includes type, timestamp, value, severity, and a human-readable message.
func DetectAlerts(readings []contract.BatteryReading) []contract.Alert {
	var out []contract.Alert
	for _, r := range readings {
		// Over-temperature
		if r.Temperature >= TempCritical {
			out = append(out, contract.Alert{
				Type:      typeOverTemp,
				Timestamp: r.Timestamp,
				Value:     r.Temperature,
				Severity:  contract.AlertSeverityCritical,
				Message:   fmt.Sprintf("temperature %.1f°C exceeds critical limit (%.0f°C)", r.Temperature, TempCritical),
			})
		} else if r.Temperature >= TempWarning {
			out = append(out, contract.Alert{
				Type:      typeOverTemp,
				Timestamp: r.Timestamp,
				Value:     r.Temperature,
				Severity:  contract.AlertSeverityWarning,
				Message:   fmt.Sprintf("temperature %.1f°C exceeds warning limit (%.0f°C)", r.Temperature, TempWarning),
			})
		}
		// Under-voltage
		if r.Voltage <= VoltageCritical {
			out = append(out, contract.Alert{
				Type:      typeUnderVoltage,
				Timestamp: r.Timestamp,
				Value:     r.Voltage,
				Severity:  contract.AlertSeverityCritical,
				Message:   fmt.Sprintf("voltage %.2f V below critical limit (%.1f V)", r.Voltage, VoltageCritical),
			})
		} else if r.Voltage <= VoltageWarning {
			out = append(out, contract.Alert{
				Type:      typeUnderVoltage,
				Timestamp: r.Timestamp,
				Value:     r.Voltage,
				Severity:  contract.AlertSeverityWarning,
				Message:   fmt.Sprintf("voltage %.2f V below warning limit (%.1f V)", r.Voltage, VoltageWarning),
			})
		}
		// Over-current
		if r.Current >= CurrentCritical {
			out = append(out, contract.Alert{
				Type:      typeOverCurrent,
				Timestamp: r.Timestamp,
				Value:     r.Current,
				Severity:  contract.AlertSeverityCritical,
				Message:   fmt.Sprintf("current %.2f A exceeds critical limit (%.0f A)", r.Current, CurrentCritical),
			})
		} else if r.Current >= CurrentWarning {
			out = append(out, contract.Alert{
				Type:      typeOverCurrent,
				Timestamp: r.Timestamp,
				Value:     r.Current,
				Severity:  contract.AlertSeverityWarning,
				Message:   fmt.Sprintf("current %.2f A exceeds warning limit (%.0f A)", r.Current, CurrentWarning),
			})
		}
	}
	return out
}
