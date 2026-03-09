// Package health provides rule-based classification of dataset health from alerts and anomalies.
package health

import (
	"cellscope/backend/internal/contract"
)

// Classify returns the overall health status based on alerts and anomalies.
// Rules (inspectable and easy to modify per GUARDRAILS):
//   - Critical: any alert with severity critical
//   - Warning: any alert with severity warning, or any anomaly (e.g. voltage drop)
//   - Stable: no critical alerts, no warning alerts, no anomalies
func Classify(alerts []contract.Alert, anomalies []contract.Anomaly) contract.HealthResult {
	for _, a := range alerts {
		if a.Severity == contract.AlertSeverityCritical {
			return contract.HealthResult{Status: contract.HealthCritical}
		}
	}
	if len(alerts) > 0 || len(anomalies) > 0 {
		return contract.HealthResult{Status: contract.HealthWarning}
	}
	return contract.HealthResult{Status: contract.HealthStable}
}
