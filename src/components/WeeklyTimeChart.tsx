"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import type { WeekData } from "./WeeklyTSSChart";

const axisTickStyle = {
  fill: "#71717a",
  fontSize: 10,
  fontFamily: "var(--font-mono)",
} as const;

const labelStyle = {
  fill: "#71717a",
  fontSize: 9,
  fontFamily: "var(--font-mono)",
} as const;

function fmtWeekLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Format seconds as "Xh Ym", e.g. "5h 23m" or "45m" */
function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function WeeklyTimeChart({ weeks }: { weeks: WeekData[] }) {
  // totalTime is in seconds; chart uses hours for the Y-axis scale
  const chartData = weeks.map((w) => ({
    ...w,
    totalHours: w.totalTime / 3600,
  }));

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted mb-4">
        Weekly Training Time
      </h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={chartData}
          margin={{ top: 16, right: 4, bottom: 0, left: -8 }}
        >
          <CartesianGrid
            stroke="#1e1e2e"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="weekStart"
            tickFormatter={fmtWeekLabel}
            tick={axisTickStyle}
            axisLine={{ stroke: "#1e1e2e" }}
            tickLine={false}
          />
          <YAxis
            tick={axisTickStyle}
            axisLine={false}
            tickLine={false}
            width={32}
            tickFormatter={(v: number) => (v > 0 ? `${v.toFixed(0)}h` : "0")}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#12121a",
              border: "1px solid #1e1e2e",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "var(--font-mono)",
            }}
            labelStyle={{ color: "#71717a", marginBottom: 4 }}
            itemStyle={{ color: "#e4e4e7" }}
            labelFormatter={(label) => fmtWeekLabel(String(label))}
            formatter={(v) => [fmtDuration(Number(v) * 3600), "Time"]}
          />
          <Bar
            dataKey="totalHours"
            name="time"
            fill="#3b82f6"
            fillOpacity={0.75}
            radius={[3, 3, 0, 0]}
          >
            <LabelList
              dataKey="totalHours"
              position="top"
              formatter={(v) => {
                const secs = Number(v) * 3600;
                return secs > 0 ? fmtDuration(secs) : "";
              }}
              style={labelStyle}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
