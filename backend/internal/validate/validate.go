// Package validate provides validation and normalization for analysis request payloads.
// Invalid or malformed rows are rejected with clear error messages.
package validate

import (
	"math"
	"strconv"

	"cellscope/backend/internal/contract"
)

// Result holds the outcome of validation. If valid, Normalized is ready for analysis.
type Result struct {
	Valid      bool
	Errors     []string
	Normalized []contract.BatteryReading
}

// ValidateRequest checks required fields and numeric validity for every reading.
// Malformed or incomplete rows are rejected. On success, Normalized contains the
// accepted readings in a consistent format for analysis.
func ValidateRequest(req *contract.AnalysisRequest) Result {
	out := Result{Normalized: make([]contract.BatteryReading, 0, len(req.Readings))}
	if req == nil {
		out.Errors = append(out.Errors, "request body is required")
		return out
	}
	if len(req.Readings) == 0 {
		out.Errors = append(out.Errors, "at least one reading is required")
		return out
	}
	for i, r := range req.Readings {
		prefix := readingPrefix(i)
		if r.Timestamp == "" {
			out.Errors = append(out.Errors, prefix+"missing timestamp")
		}
		if !isFinite(r.Voltage) {
			out.Errors = append(out.Errors, prefix+"invalid voltage (must be a finite number)")
		}
		if !isFinite(r.Current) {
			out.Errors = append(out.Errors, prefix+"invalid current (must be a finite number)")
		}
		if !isFinite(r.Temperature) {
			out.Errors = append(out.Errors, prefix+"invalid temperature (must be a finite number)")
		}
		if r.Timestamp != "" && isFinite(r.Voltage) && isFinite(r.Current) && isFinite(r.Temperature) {
			out.Normalized = append(out.Normalized, contract.BatteryReading{
				Timestamp:   r.Timestamp,
				Voltage:     r.Voltage,
				Current:     r.Current,
				Temperature: r.Temperature,
			})
		}
	}
	if len(out.Errors) == 0 {
		out.Valid = true
	}
	return out
}

func readingPrefix(index int) string {
	return "reading " + strconv.Itoa(index) + ": "
}

func isFinite(f float64) bool {
	return !math.IsNaN(f) && !math.IsInf(f, 0)
}
