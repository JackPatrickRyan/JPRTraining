"use client";

import { getSportCategory } from "@/lib/tss";
import type { ActivityRow } from "./DashboardContent";

const SPORT_COLORS: Record<string, string> = {
  bike: "#f59e0b",
  run: "#10b981",
  swim: "#06b6d4",
  other: "#8b5cf6",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtDistance(meters: number) {
  if (meters <= 0) return "—";
  const km = meters / 1000;
  return km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(meters)} m`;
}

export default function RecentActivities({
  activities,
}: {
  activities: ActivityRow[];
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted mb-4">
        Recent Activities
      </h2>

      {activities.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-8">
          No activities yet — sync with Strava to get started.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Date", "Activity", "Duration", "Distance", "TSS"].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={`pb-2 font-mono text-[10px] tracking-wider text-text-muted uppercase ${
                        i > 1 ? "text-right" : "text-left"
                      } ${i > 0 ? "pl-4" : ""}`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {activities.map((a) => {
                const cat = getSportCategory(a.sportType);
                const color = SPORT_COLORS[cat];
                return (
                  <tr
                    key={a.id}
                    className="border-b border-border/40 hover:bg-bg/40 transition-colors"
                  >
                    <td className="py-2 font-mono text-xs text-text-muted whitespace-nowrap">
                      {fmtDate(a.startDate)}
                    </td>
                    <td className="py-2 pl-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-text-primary truncate max-w-[220px]">
                          {a.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pl-4 text-right font-mono text-xs text-text-muted whitespace-nowrap">
                      {fmtDuration(a.movingTime)}
                    </td>
                    <td className="py-2 pl-4 text-right font-mono text-xs text-text-muted whitespace-nowrap">
                      {fmtDistance(a.distance)}
                    </td>
                    <td
                      className="py-2 pl-4 text-right font-numeric text-xs"
                      style={{ color }}
                    >
                      {Math.round(a.tss)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
