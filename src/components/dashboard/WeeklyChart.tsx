"use client";

import { useState } from "react";
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
import type { WeekRow } from "./DashboardContent";

const SPORT_COLORS = {
  swim: "#2563eb",
  bike: "#16a34a",
  run: "#dc2626",
  other: "#9ca3af",
};

const SPORT_ORDER = ["swim", "bike", "run", "other"] as const;
type Sport = (typeof SPORT_ORDER)[number];

function fmtWeek(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtHours(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

type View = "tss" | "time";

type ChartRow = WeekRow & { totalHours: number };

const tooltipStyle = {
  backgroundColor: "#12121a",
  border: "1px solid #1e1e2e",
  borderRadius: 8,
  fontSize: 12,
  fontFamily: "var(--font-mono)",
  padding: "10px 14px",
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

function TSSTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ color: "#71717a", marginBottom: 8, fontSize: 11 }}>
        {fmtWeek(String(label))}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {SPORT_ORDER.map((sport: Sport) => {
          const val = Math.round(Number(row[`${sport}TSS` as keyof ChartRow]));
          return (
            <div key={sport} style={{ display: "flex", alignItems: "center", gap: 0 }}>
              <span style={{ color: SPORT_COLORS[sport], minWidth: 44, fontSize: 11 }}>
                {sport.toUpperCase()}
              </span>
              <span style={{ color: "#4b5563", marginRight: 8 }}>:</span>
              <span style={{ color: "#e4e4e7", minWidth: 32, textAlign: "right", fontSize: 11 }}>
                {val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ color: "#71717a", marginBottom: 8, fontSize: 11 }}>
        {fmtWeek(String(label))}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <span style={{ color: "#9ca3af", minWidth: 44, fontSize: 11 }}>TOTAL</span>
        <span style={{ color: "#4b5563", marginRight: 8 }}>:</span>
        <span style={{ color: "#e4e4e7", fontSize: 11 }}>{fmtHours(row.totalTime)}</span>
      </div>
    </div>
  );
}

export default function WeeklyChart({ weeks }: { weeks: WeekRow[] }) {
  const [view, setView] = useState<View>("tss");

  const chartData: ChartRow[] = weeks.slice(-12).map((w) => ({
    ...w,
    totalHours: w.totalTime / 3600,
  }));

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted">
          Weekly Training Load
        </h2>
        <div className="flex gap-1">
          {(["tss", "time"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2 py-0.5 text-[10px] font-mono tracking-wider rounded border transition-colors ${
                view === v
                  ? "border-ctl text-ctl"
                  : "border-border text-text-muted hover:border-text-muted"
              }`}
            >
              {v === "tss" ? "TSS" : "TIME"}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        {view === "tss" ? (
          <BarChart
            data={chartData}
            margin={{ top: 16, right: 4, bottom: 0, left: 4 }}
          >
            <CartesianGrid
              stroke="#1e1e2e"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="weekStart"
              tickFormatter={fmtWeek}
              tick={axisTickStyle}
              axisLine={{ stroke: "#1e1e2e" }}
              tickLine={false}
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<TSSTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                paddingTop: 8,
              }}
              content={() => (
                <div style={{ display: "flex", gap: 16, justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 10 }}>
                  {SPORT_ORDER.map((sport) => (
                    <span key={sport} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: SPORT_COLORS[sport] }} />
                      <span style={{ color: "#71717a" }}>{sport.toUpperCase()}</span>
                    </span>
                  ))}
                </div>
              )}
            />
            <Bar dataKey="swimTSS" name="swim" stackId="a" fill={SPORT_COLORS.swim} />
            <Bar dataKey="bikeTSS" name="bike" stackId="a" fill={SPORT_COLORS.bike} />
            <Bar dataKey="runTSS" name="run" stackId="a" fill={SPORT_COLORS.run} />
            <Bar
              dataKey="otherTSS"
              name="other"
              stackId="a"
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
        ) : (
          <BarChart
            data={chartData}
            margin={{ top: 16, right: 4, bottom: 0, left: 4 }}
          >
            <CartesianGrid
              stroke="#1e1e2e"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="weekStart"
              tickFormatter={fmtWeek}
              tick={axisTickStyle}
              axisLine={{ stroke: "#1e1e2e" }}
              tickLine={false}
            />
            <YAxis
              tick={axisTickStyle}
              axisLine={false}
              tickLine={false}
              width={36}
              tickFormatter={(v: number) => `${v.toFixed(0)}h`}
            />
            <Tooltip content={<TimeTooltip />} />
            <Bar
              dataKey="totalHours"
              name="time"
              fill="#3b82f6"
              fillOpacity={0.7}
              radius={[3, 3, 0, 0]}
            >
              <LabelList
                dataKey="totalHours"
                position="top"
                formatter={(v) => {
                  const n = Number(v);
                  return n > 0 ? fmtHours(n * 3600) : "";
                }}
                style={labelStyle}
              />
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
