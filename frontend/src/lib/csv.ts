/**
 * Parse and validate CSV for battery readings. Required columns: timestamp, voltage, current, temperature.
 */

import type { BatteryReading } from "@/types/contract";

const REQUIRED_COLUMNS = ["timestamp", "voltage", "current", "temperature"] as const;

/** Maximum rows to accept from a single CSV to keep UI and backend responsive. */
export const MAX_CSV_ROWS = 10_000;

export interface ParseResult {
  ok: true;
  readings: BatteryReading[];
}

export interface ParseError {
  ok: false;
  message: string;
  details?: string[];
}

export type CsvParseResult = ParseResult | ParseError;

function findColumnIndex(headers: string[], name: string): number {
  const lower = name.toLowerCase();
  const i = headers.findIndex((h) => h.trim().toLowerCase() === lower);
  return i;
}

/**
 * Parse CSV text into battery readings. Validates required columns and numeric fields.
 * Returns either readings or an error with message and optional details.
 */
export function parseBatteryCsv(csvText: string): CsvParseResult {
  const lines = csvText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { ok: false, message: "CSV must have a header row and at least one data row." };
  }

  const headerLine = lines[0];
  const headers = headerLine.split(",").map((s) => s.trim());

  const indices: Record<string, number> = {};
  for (const col of REQUIRED_COLUMNS) {
    const i = findColumnIndex(headers, col);
    if (i === -1) {
      return {
        ok: false,
        message: `Missing required column: ${col}.`,
        details: [`Required columns: ${REQUIRED_COLUMNS.join(", ")}. Found: ${headers.join(", ") || "(none)"}.`],
      };
    }
    indices[col] = i;
  }

  const readings: BatteryReading[] = [];
  const details: string[] = [];

  for (let rowNum = 1; rowNum < lines.length; rowNum++) {
    const line = lines[rowNum];
    const cells = line.split(",").map((s) => s.trim());

    const ts = cells[indices.timestamp] ?? "";
    const vStr = cells[indices.voltage] ?? "";
    const cStr = cells[indices.current] ?? "";
    const tStr = cells[indices.temperature] ?? "";

    if (!ts) {
      details.push(`Row ${rowNum + 1}: missing timestamp`);
      continue;
    }
    const voltage = Number(vStr);
    const current = Number(cStr);
    const temperature = Number(tStr);
    if (Number.isNaN(voltage) || Number.isNaN(current) || Number.isNaN(temperature)) {
      details.push(
        `Row ${rowNum + 1}: voltage, current, and temperature must be numbers (got "${vStr}", "${cStr}", "${tStr}")`
      );
      continue;
    }
    if (!Number.isFinite(voltage) || !Number.isFinite(current) || !Number.isFinite(temperature)) {
      details.push(`Row ${rowNum + 1}: voltage, current, and temperature must be finite numbers`);
      continue;
    }

    readings.push({
      timestamp: ts,
      voltage,
      current,
      temperature,
    });
    if (readings.length > MAX_CSV_ROWS) {
      return {
        ok: false,
        message: `CSV has too many rows. Maximum is ${MAX_CSV_ROWS} rows.`,
        details: [`Found more than ${MAX_CSV_ROWS} valid rows. Reduce the file size or split the data.`],
      };
    }
  }

  if (readings.length === 0) {
    return {
      ok: false,
      message: "No valid rows in CSV.",
      details: details.length > 0 ? details : ["Add at least one row with timestamp, voltage, current, temperature."],
    };
  }

  if (details.length > 0) {
    return {
      ok: false,
      message: `Some rows were invalid (${details.length} error(s)). Valid rows: ${readings.length}. Fix errors or remove invalid rows.`,
      details,
    };
  }

  return { ok: true, readings };
}
