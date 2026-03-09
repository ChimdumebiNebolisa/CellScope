// Package smooth provides moving average smoothing for time-series data.
package smooth

import (
	"cellscope/backend/internal/contract"
)

// MovingAverageWindow is the number of points used for each smoothed value (centered).
const MovingAverageWindow = 5

// MovingAverage computes a centered moving average. At boundaries, uses available points only.
func MovingAverage(values []float64, window int) []float64 {
	n := len(values)
	if n == 0 {
		return nil
	}
	out := make([]float64, n)
	half := window / 2
	for i := 0; i < n; i++ {
		lo := i - half
		if lo < 0 {
			lo = 0
		}
		hi := i + half
		if hi >= n {
			hi = n - 1
		}
		var sum float64
		for j := lo; j <= hi; j++ {
			sum += values[j]
		}
		out[i] = sum / float64(hi-lo+1)
	}
	return out
}

// SmoothReadings returns smoothed voltage, current, and temperature slices for the given readings.
func SmoothReadings(readings []contract.BatteryReading) (voltage, current, temperature []float64) {
	n := len(readings)
	if n == 0 {
		return nil, nil, nil
	}
	v := make([]float64, n)
	c := make([]float64, n)
	t := make([]float64, n)
	for i, r := range readings {
		v[i] = r.Voltage
		c[i] = r.Current
		t[i] = r.Temperature
	}
	return MovingAverage(v, MovingAverageWindow),
		MovingAverage(c, MovingAverageWindow),
		MovingAverage(t, MovingAverageWindow)
}
