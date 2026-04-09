"use client";

import type { WeekRow } from "./DashboardContent";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function WeekSummaryCard({ week }: { week: WeekRow | null }) {
  const tss = week ? Math.round(week.totalTSS) : null;
  const time = week ? formatTime(week.totalTime) : null;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted">
          This Week
        </span>
        <span className="text-xs text-text-muted">TSS &amp; Time</span>
      </div>
      <div className="flex items-end gap-6">
        <div>
          <div className="font-numeric text-5xl font-light leading-none text-text">
            {tss ?? "—"}
          </div>
          <div className="text-xs text-text-muted font-mono mt-1">TSS</div>
        </div>
        <div className="mb-0.5">
          <div className="font-numeric text-3xl font-light leading-none text-text-muted">
            {time ?? "—"}
          </div>
          <div className="text-xs text-text-muted font-mono mt-1">Time</div>
        </div>
      </div>
    </div>
  );
}
