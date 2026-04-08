"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
} from "recharts";

export type WeekData = {
  weekStart: string; // ISO string of the Monday
  week: number;
  totalTSS: number;
  bikeTSS: number;
  runTSS: number;
  swimTSS: number;
  otherTSS: number;
  totalTime: number;
};

const SPORT_COLORS = {
  bike: "#f59e0b",
  run: "#10b981",
  swim: "#06b6d4",
  other: "#8b5cf6",
};

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

export default function WeeklyTSSChart({ weeks }: { weeks: WeekData[] }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted mb-4">
        Weekly TSS
      </h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={weeks}
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
            formatter={(v, name) => [
              Math.round(Number(v)),
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
          <Bar
            dataKey="bikeTSS"
            name="bike"
            stackId="tss"
            fill={SPORT_COLORS.bike}
          />
          <Bar
            dataKey="runTSS"
            name="run"
            stackId="tss"
            fill={SPORT_COLORS.run}
          />
          <Bar
            dataKey="swimTSS"
            name="swim"
            stackId="tss"
            fill={SPORT_COLORS.swim}
          />
          <Bar
            dataKey="otherTSS"
            name="other"
            stackId="tss"
            fill={SPORT_COLORS.other}
            radius={[3, 3, 0, 0]}
          >
            <LabelList
              dataKey="totalTSS"
              position="top"
              formatter={(v) => {
                const n = Math.round(Number(v));
                return n > 0 ? String(n) : "";
              }}
              style={labelStyle}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
