"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { DayRow } from "./DashboardContent";

type Current = { ctl: number; atl: number; tsb: number } | null;

const CARDS = [
  { key: "ctl" as const, label: "CTL", sublabel: "Fitness", color: "#3b82f6" },
  { key: "atl" as const, label: "ATL", sublabel: "Fatigue", color: "#f472b6" },
  { key: "tsb" as const, label: "TSB", sublabel: "Form", color: null },
];

export default function HeroMetrics({
  current,
  days,
}: {
  current: Current;
  days: DayRow[];
}) {
  const sparkData = days.slice(-42);
  const vals = {
    ctl: current?.ctl ?? 0,
    atl: current?.atl ?? 0,
    tsb: current?.tsb ?? 0,
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {CARDS.map((card) => {
        const v = vals[card.key];
        const color =
          card.key === "tsb"
            ? v >= 0
              ? "#22c55e"
              : "#ef4444"
            : card.color!;
        const sign = card.key === "tsb" && v > 0 ? "+" : "";

        return (
          <div
            key={card.key}
            className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted">
                {card.label}
              </span>
              <span className="text-xs text-text-muted">{card.sublabel}</span>
            </div>
            <div
              className="font-numeric text-5xl font-light leading-none"
              style={{ color }}
            >
              {sign}
              {Math.round(v)}
            </div>
            <div className="-mx-1">
              <ResponsiveContainer width="100%" height={36}>
                <LineChart data={sparkData}>
                  <Line
                    type="monotone"
                    dataKey={card.key}
                    stroke={color}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
