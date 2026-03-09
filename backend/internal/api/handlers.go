// Package api holds analysis and other API handlers.
// All analysis is request-scoped and in-memory only: no global state or server-side persistence.
package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"cellscope/backend/internal/alerts"
	"cellscope/backend/internal/anomaly"
	"cellscope/backend/internal/charts"
	"cellscope/backend/internal/contract"
	"cellscope/backend/internal/health"
	"cellscope/backend/internal/metrics"
	"cellscope/backend/internal/smooth"
	"cellscope/backend/internal/validate"
)

const maxRequestBodyBytes = 1 << 20 // 1 MiB
const maxReadings = 50000

// AnalyzeHandler handles POST /api/analyze. It accepts a dataset payload and returns
// a structured analysis response. Analysis is request-scoped and in-memory only;
// no data is stored on the server.
func AnalyzeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()

	var req contract.AnalysisRequest
	if err := dec.Decode(&req); err != nil {
		writeError(w, "invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	v := validate.ValidateRequest(&req)
	if !v.Valid {
		writeValidationErrors(w, v.Errors)
		return
	}

	if len(v.Normalized) > maxReadings {
		writeError(w, fmt.Sprintf("dataset too large (max %d readings)", maxReadings), http.StatusBadRequest)
		return
	}

	// Build response from normalized readings (in-memory only; no server-side persistence).
	resp := buildAnalysisResponse(v.Normalized)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}

func writeError(w http.ResponseWriter, message string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func writeValidationErrors(w http.ResponseWriter, details []string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"error":  "validation failed",
		"details": details,
	})
}

func buildAnalysisResponse(normalized []contract.BatteryReading) *contract.AnalysisResponse {
	alertsList := alerts.DetectAlerts(normalized)
	anomaliesList := anomaly.DetectVoltageDrops(normalized)
	vSmoothed, cSmoothed, tSmoothed := smooth.SmoothReadings(normalized)
	return &contract.AnalysisResponse{
		Summary:     metrics.ComputeSummary(normalized),
		Alerts:      alertsList,
		Anomalies:   anomaliesList,
		ChartSeries: charts.BuildSeries(normalized, vSmoothed, cSmoothed, tSmoothed),
		Health:      health.Classify(alertsList, anomaliesList),
	}
}
