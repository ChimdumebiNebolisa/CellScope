"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";
import type { ChartSeries, Anomaly } from "@/types/contract";
import { theme } from "@/theme";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

function getSeries(series: ChartSeries[], label: string): ChartSeries | undefined {
  return series.find((s) => s.label === label);
}

function buildChartOptions(
  annotations?: { index: number }[],
  yMin?: number,
  yMax?: number
): object {
  const yMinVal = yMin ?? 0;
  const yMaxVal = yMax ?? 100;
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      annotation:
        annotations?.length && yMin != null && yMax != null
          ? {
              annotations: annotations.reduce(
                (acc, a, i) => ({
                  ...acc,
                  [`vline-${i}`]: {
                    type: "line" as const,
                    xMin: a.index,
                    xMax: a.index,
                    yMin: yMinVal,
                    yMax: yMaxVal,
                    borderColor: theme.chart.anomaly,
                    borderWidth: 1,
                    borderDash: [4, 2],
                    label: { display: false },
                  },
                }),
                {} as Record<string, object>
              ),
            }
          : {},
    },
    scales: {
      x: {
        title: { display: true, text: "Time" },
        ticks: { maxTicksLimit: 8, maxRotation: 45 },
      },
      y: {
        title: { display: true, text: "Value" },
        beginAtZero: false,
      },
    },
  };
}

type Props = {
  chartSeries: ChartSeries[];
  anomalies?: Anomaly[];
};

export function TimeSeriesCharts({ chartSeries, anomalies = [] }: Props) {
  const voltageSeries = getSeries(chartSeries, "voltage");
  const voltageSmoothed = getSeries(chartSeries, "voltage_smoothed");
  const currentSeries = getSeries(chartSeries, "current");
  const currentSmoothed = getSeries(chartSeries, "current_smoothed");
  const tempSeries = getSeries(chartSeries, "temperature");
  const tempSmoothed = getSeries(chartSeries, "temperature_smoothed");

  const buildData = (
    raw: ChartSeries | undefined,
    smoothed: ChartSeries | undefined,
    rawColor: string,
    smoothedColor: string
  ) => {
    const series = raw ?? smoothed;
    if (!series?.dataPoints?.length) return null;
    const labels = series.dataPoints.map((p) => p.timestamp);
    const datasets = [];
    if (raw?.dataPoints?.length) {
      datasets.push({
        label: raw.label,
        data: raw.dataPoints.map((p) => p.value),
        borderColor: rawColor,
        backgroundColor: "transparent",
        tension: 0.2,
        pointRadius: 2,
      });
    }
    if (smoothed?.dataPoints?.length) {
      datasets.push({
        label: smoothed.label,
        data: smoothed.dataPoints.map((p) => p.value),
        borderColor: smoothedColor,
        backgroundColor: "transparent",
        tension: 0.2,
        pointRadius: 2,
      });
    }
    return { labels, datasets };
  };

  const timestamps = voltageSeries?.dataPoints?.map((p) => p.timestamp) ?? [];
  const anomalyIndices = anomalies
    .map((a) => timestamps.indexOf(a.timestamp))
    .filter((i) => i >= 0);
  const anomalyAnnotations =
    anomalyIndices.length > 0 ? anomalyIndices.map((index) => ({ index })) : undefined;

  const voltageData = buildData(voltageSeries, voltageSmoothed, theme.chart.voltage, theme.chart.voltageSmoothed);
  const currentData = buildData(currentSeries, currentSmoothed, theme.chart.current, theme.chart.currentSmoothed);
  const tempData = buildData(tempSeries, tempSmoothed, theme.chart.temperature, theme.chart.temperatureSmoothed);

  const voltageYExtent = (() => {
    if (!voltageSeries?.dataPoints?.length) return undefined;
    const vals = voltageSeries.dataPoints.map((p) => p.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min) * 0.1 || 1;
    return { min: min - pad, max: max + pad };
  })();
  const optionsVoltage = buildChartOptions(
    anomalyAnnotations,
    voltageYExtent?.min,
    voltageYExtent?.max
  );

  const height = 220;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {voltageData && (
        <div>
          <h4 style={{ marginBottom: "0.5rem", fontSize: "14px", color: theme.text }}>Voltage over time</h4>
          <div style={{ height: `${height}px` }}>
            <Line data={voltageData} options={optionsVoltage} />
          </div>
          {anomalyIndices.length > 0 && (
            <p style={{ fontSize: "12px", color: theme.muted, marginTop: "4px" }}>
              Dashed vertical lines: voltage drop anomalies
            </p>
          )}
        </div>
      )}
      {currentData && (
        <div>
          <h4 style={{ marginBottom: "0.5rem", fontSize: "14px", color: theme.text }}>Current over time</h4>
          <div style={{ height: `${height}px` }}>
            <Line data={currentData} options={buildChartOptions()} />
          </div>
        </div>
      )}
      {tempData && (
        <div>
          <h4 style={{ marginBottom: "0.5rem", fontSize: "14px", color: theme.text }}>Temperature over time</h4>
          <div style={{ height: `${height}px` }}>
            <Line data={tempData} options={buildChartOptions()} />
          </div>
        </div>
      )}
      {!voltageData && !currentData && !tempData && (
        <p style={{ color: theme.muted, fontSize: "14px" }}>No chart data.</p>
      )}
    </div>
  );
}
