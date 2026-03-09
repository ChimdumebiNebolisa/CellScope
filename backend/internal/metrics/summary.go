// Package metrics computes summary statistics from normalized battery readings.
package metrics

import (
	"cellscope/backend/internal/contract"
	"math"
)

// ComputeSummary derives aggregate metrics from the given readings.
// Caller must pass at least one reading (validation enforces this upstream).
func ComputeSummary(readings []contract.BatteryReading) contract.SummaryMetrics {
	n := len(readings)
	if n == 0 {
		return contract.SummaryMetrics{}
	}
	var sumV, sumC float64
	minV := math.MaxFloat64
	maxV := -math.MaxFloat64
	maxT := readings[0].Temperature
	for _, r := range readings {
		sumV += r.Voltage
		sumC += r.Current
		if r.Voltage < minV {
			minV = r.Voltage
		}
		if r.Voltage > maxV {
			maxV = r.Voltage
		}
		if r.Temperature > maxT {
			maxT = r.Temperature
		}
	}
	return contract.SummaryMetrics{
		TotalReadings:   n,
		AverageVoltage:  sumV / float64(n),
		AverageCurrent:  sumC / float64(n),
		PeakTemperature: maxT,
		MinVoltage:      minV,
		MaxVoltage:      maxV,
	}
}
