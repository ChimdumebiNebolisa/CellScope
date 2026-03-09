"use client";

import { useEffect, useState } from "react";
import type { AnalysisRequest, AnalysisResponse } from "@/types/contract";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<{
    ok: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const [analyzeResult, setAnalyzeResult] = useState<{
    ok: boolean;
    data?: AnalysisResponse;
    error?: string;
  } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error(`HTTP ${res.status}`);
      })
      .then((data) => setBackendStatus({ ok: true, message: data.message }))
      .catch((err) =>
        setBackendStatus({
          ok: false,
          error: err instanceof Error ? err.message : "Request failed",
        })
      );
  }, []);

  const testAnalyze = () => {
    setAnalyzeResult(null);
    const payload: AnalysisRequest = {
      readings: [
        {
          timestamp: "2025-03-09T10:00:00Z",
          voltage: 3.85,
          current: 1.2,
          temperature: 28.5,
        },
      ],
    };
    fetch(`${API_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const text = await res.text();
        let data: unknown;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          const snippet = text.slice(0, 80).replace(/\s+/g, " ");
          throw new Error(
            `Server did not return valid JSON. Is the backend at ${API_URL} running? Response: ${snippet}${text.length > 80 ? "…" : ""}`
          );
        }
        if (!res.ok) {
          const msg = (data as { error?: string })?.error ?? `HTTP ${res.status}`;
          throw new Error(msg);
        }
        return data as AnalysisResponse;
      })
      .then((data) => setAnalyzeResult({ ok: true, data }))
      .catch((err) =>
        setAnalyzeResult({
          ok: false,
          error: err instanceof Error ? err.message : "Request failed",
        })
      );
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>CellScope</h1>
      <p>Battery diagnostics tool</p>
      <section style={{ marginTop: "1.5rem" }}>
        <h2>Backend connection</h2>
        {backendStatus === null && <p>Checking backend…</p>}
        {backendStatus?.ok && (
          <p style={{ color: "green" }}>✓ {backendStatus.message}</p>
        )}
        {backendStatus && !backendStatus.ok && (
          <p style={{ color: "red" }}>✗ {backendStatus.error}</p>
        )}
      </section>
      <section style={{ marginTop: "1.5rem" }}>
        <h2>Analysis API</h2>
        <button type="button" onClick={testAnalyze} disabled={backendStatus?.ok !== true}>
          Test analyze (POST /api/analyze)
        </button>
        {analyzeResult === null && <p style={{ marginTop: "0.5rem", color: "#666" }}>Click to send a sample payload.</p>}
        {analyzeResult?.ok && analyzeResult.data && (
          <pre style={{ marginTop: "0.5rem", padding: "1rem", background: "#f5f5f5", fontSize: "12px", overflow: "auto" }}>
            {JSON.stringify(analyzeResult.data, null, 2)}
          </pre>
        )}
        {analyzeResult && !analyzeResult.ok && (
          <p style={{ marginTop: "0.5rem", color: "red" }}>✗ {analyzeResult.error}</p>
        )}
      </section>
    </main>
  );
}
