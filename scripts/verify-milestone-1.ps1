# Verify Milestones 1.1-1.3: scaffolding, contract, and analysis route.
# Run from repo root. Starts backend on 8081 to avoid clashing with dev server on 8080.

$ErrorActionPreference = "Stop"
$BackendPort = 8081
$BaseUrl = "http://localhost:$BackendPort"
$Root = if ($PSScriptRoot) { Split-Path $PSScriptRoot } else { (Get-Location).Path }
if (-not (Test-Path "$Root\backend\cmd\server\main.go")) { $Root = (Get-Location).Path }

Write-Host "=== CellScope Milestone 1 Verification ===" -ForegroundColor Cyan
Write-Host "Using backend port $BackendPort" -ForegroundColor Gray

# Start backend on 8081 in background
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:Root
    $env:PORT = $using:BackendPort
    Set-Location "$using:Root\backend"
    go run ./cmd/server 2>&1
}
Start-Sleep -Seconds 4

$failed = 0

Write-Host "`n--- Checkpoint 1.1: Project scaffolding ---" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
    if ($health.message -match "CellScope") {
        Write-Host "  [PASS] GET /health returns JSON with message" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] GET /health response unexpected: $health" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "  [FAIL] GET /health failed. $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

Write-Host "`n--- Checkpoint 1.2: Shared data contract ---" -ForegroundColor Yellow
$contractGo = Join-Path $Root "backend\internal\contract\types.go"
$contractTs = Join-Path $Root "frontend\src\types\contract.ts"
$contractDoc = Join-Path $Root "docs\CONTRACT.md"
$hasContract = (Test-Path $contractGo) -and (Test-Path $contractTs) -and (Test-Path $contractDoc)
if ($hasContract) {
    Write-Host "  [PASS] Backend types: backend/internal/contract/types.go" -ForegroundColor Green
    Write-Host "  [PASS] Frontend types: frontend/src/types/contract.ts" -ForegroundColor Green
    Write-Host "  [PASS] Contract doc: docs/CONTRACT.md" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Missing contract files" -ForegroundColor Red
    $failed++
}

Write-Host "`n--- Checkpoint 1.3: Basic analysis route ---" -ForegroundColor Yellow
$body = '{"readings":[{"timestamp":"2025-03-09T10:00:00Z","voltage":3.85,"current":1.2,"temperature":28.5}]}'
try {
    $analyze = Invoke-RestMethod -Uri "$BaseUrl/api/analyze" -Method Post -Body $body -ContentType "application/json"
    if ($analyze.summary -and $analyze.health -and $null -ne $analyze.alerts -and $null -ne $analyze.anomalies -and $null -ne $analyze.chartSeries) {
        Write-Host "  [PASS] POST /api/analyze returns structured response (summary, alerts, anomalies, chartSeries, health)" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] POST /api/analyze response missing required fields" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "  [FAIL] POST /api/analyze failed: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

try {
    Invoke-RestMethod -Uri "$BaseUrl/api/analyze" -Method Post -Body "{invalid" -ContentType "application/json"
    Write-Host "  [FAIL] Invalid JSON should return 400" -ForegroundColor Red
    $failed++
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
        Write-Host "  [PASS] Invalid JSON returns 400" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Invalid JSON returned $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        $failed++
    }
}

try {
    Invoke-RestMethod -Uri "$BaseUrl/api/analyze" -Method Get
    Write-Host "  [FAIL] GET /api/analyze should return 405" -ForegroundColor Red
    $failed++
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 405) {
        Write-Host "  [PASS] GET /api/analyze returns 405 Method Not Allowed" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] GET /api/analyze returned $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        $failed++
    }
}

Stop-Job $backendJob -ErrorAction SilentlyContinue
Remove-Job $backendJob -Force -ErrorAction SilentlyContinue
Write-Host "`n=== Done ===" -ForegroundColor Cyan
if ($failed -gt 0) { exit 1 }
exit 0
