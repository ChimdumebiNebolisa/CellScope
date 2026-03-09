"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<{
    ok: boolean;
    message?: string;
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
    </main>
  );
}
