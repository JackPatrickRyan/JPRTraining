"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { DayRow } from "./DashboardContent";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function FitnessChart({ days }: { days: DayRow[] }) {
  const ticks = days
    .filter((_, i) => i % 14 === 0 || i === days.length - 1)
    .map((d) => d.date);

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted mb-4">
        Fitness · Fatigue · Form — 12 weeks
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={days} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="tsbFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#1e1e2e"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={fmtDate}
            tick={{
              fill: "#71717a",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
            }}
            axisLine={{ stroke: "#1e1e2e" }}
            tickLine={false}
          />
          <YAxis
            tick={{
              fill: "#71717a",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
            }}
            axisLine={false}
            tickLine={false}
            width={32}
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
            labelFormatter={(label) => fmtDate(String(label))}
            formatter={(value, name) => [
              Math.round(Number(value)),
              String(name).toUpperCase(),
            ]}
          />
          <Legend
            wrapperStyle={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              paddingTop: 8,
            }}
            formatter={(v) => (
              <span style={{ color: "#71717a" }}>{String(v).toUpperCase()}</span>
            )}
          />
          <ReferenceLine y={0} stroke="#1e1e2e" strokeDasharray="4 2" />
          <Area
            type="monotone"
            dataKey="tsb"
            name="tsb"
            fill="url(#tsbFill)"
            stroke="#22c55e"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            baseValue={0}
          />
          <Line
            type="monotone"
            dataKey="atl"
            name="atl"
            stroke="#f472b6"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="ctl"
            name="ctl"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
