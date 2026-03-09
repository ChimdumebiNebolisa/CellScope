// Package charts builds chart-ready time series from readings and smoothed data.
package charts

import (
	"cellscope/backend/internal/contract"
)

// BuildSeries returns chart series for raw and smoothed voltage, current, and temperature.
// Smoothed slices must match readings in length; if nil, only raw series are included.
func BuildSeries(readings []contract.BatteryReading, voltageSmoothed, currentSmoothed, tempSmoothed []float64) []contract.ChartSeries {
	var out []contract.ChartSeries
	n := len(readings)
	if n == 0 {
		return out
	}

	// Raw series
	out = append(out, seriesFromReadings(readings, "voltage", func(r contract.BatteryReading) float64 { return r.Voltage }))
	out = append(out, seriesFromReadings(readings, "current", func(r contract.BatteryReading) float64 { return r.Current }))
	out = append(out, seriesFromReadings(readings, "temperature", func(r contract.BatteryReading) float64 { return r.Temperature }))

	// Smoothed series (if provided)
	if len(voltageSmoothed) == n {
		out = append(out, seriesFromSlice(readings, voltageSmoothed, "voltage_smoothed"))
	}
	if len(currentSmoothed) == n {
		out = append(out, seriesFromSlice(readings, currentSmoothed, "current_smoothed"))
	}
	if len(tempSmoothed) == n {
		out = append(out, seriesFromSlice(readings, tempSmoothed, "temperature_smoothed"))
	}
	return out
}

func seriesFromReadings(readings []contract.BatteryReading, label string, valueFn func(contract.BatteryReading) float64) contract.ChartSeries {
	pts := make([]contract.ChartPoint, len(readings))
	for i, r := range readings {
		pts[i] = contract.ChartPoint{Timestamp: r.Timestamp, Value: valueFn(r)}
	}
	return contract.ChartSeries{Label: label, DataPoints: pts}
}

func seriesFromSlice(readings []contract.BatteryReading, values []float64, label string) contract.ChartSeries {
	pts := make([]contract.ChartPoint, len(readings))
	for i, r := range readings {
		pts[i] = contract.ChartPoint{Timestamp: r.Timestamp, Value: values[i]}
	}
	return contract.ChartSeries{Label: label, DataPoints: pts}
}
