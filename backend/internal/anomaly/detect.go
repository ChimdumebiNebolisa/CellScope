// Package anomaly detects anomalies in battery readings (e.g. sudden voltage drops).
package anomaly

import (
	"cellscope/backend/internal/contract"
	"fmt"
)

// VoltageDropThresholdV is the minimum drop (in volts) between consecutive readings to flag as anomaly.
const VoltageDropThresholdV = 0.5

const typeVoltageDrop = "voltage_drop"

// DetectVoltageDrops finds sudden voltage drops between consecutive readings.
// Returns one anomaly per drop that exceeds the threshold.
func DetectVoltageDrops(readings []contract.BatteryReading) []contract.Anomaly {
	var out []contract.Anomaly
	for i := 1; i < len(readings); i++ {
		prev := readings[i-1].Voltage
		curr := readings[i].Voltage
		drop := prev - curr
		if drop >= VoltageDropThresholdV {
			out = append(out, contract.Anomaly{
				Type:      typeVoltageDrop,
				Timestamp: readings[i].Timestamp,
				Value:     curr,
				Message:   fmt.Sprintf("sudden voltage drop of %.2f V detected (%.2f V -> %.2f V)", drop, prev, curr),
			})
		}
	}
	return out
}
