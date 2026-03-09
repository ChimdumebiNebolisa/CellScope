/**
 * Theme constants for CellScope. Single source of truth for colors and spacing.
 * Keeps the UI cohesive and easy to adjust; no CSS variables or extra tooling.
 */
export const theme = {
  /** Primary brand (headings, main actions, links) */
  primary: "#0d9488",
  primaryDark: "#0f766e",
  /** Section/card backgrounds (distinct tints for clarity) */
  surface: "#f0fdfa",
  surfaceAlt: "#fefce8",
  surfaceMuted: "#f8fafc",
  /** Semantic status */
  success: "#059669",
  warning: "#d97706",
  error: "#dc2626",
  /** Text */
  text: "#1e293b",
  muted: "#64748b",
  /** Borders and inputs */
  border: "#e2e8f0",
  borderMuted: "#cbd5e1",
  inputBg: "#ffffff",
  /** Chart series (aligned with theme) */
  chart: {
    voltage: "rgb(13, 148, 136)",
    voltageSmoothed: "rgb(126, 34, 206)",
    current: "rgb(5, 150, 105)",
    currentSmoothed: "rgb(14, 165, 233)",
    temperature: "rgb(217, 119, 6)",
    temperatureSmoothed: "rgb(219, 39, 119)",
    anomaly: "rgba(220, 38, 38, 0.6)",
  },
} as const;
