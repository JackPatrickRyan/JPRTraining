"use client";

import { getSportCategory } from "@/lib/tss";

export type Activity = {
  id: string;
  name: string;
  sportType: string;
  startDate: string; // ISO string
  movingTime: number; // seconds
  distance: number; // metres
  tss: number;
};

const SPORT_COLORS: Record<string, string> = {
  bike: "#f59e0b",
  run: "#10b981",
  swim: "#06b6d4",
  other: "#8b5cf6",
};

// "Today", "Yesterday", "Mon", or "3 Mar"
function fmtRelativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const actDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (today.getTime() - actDay.getTime()) / 86_400_000
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return d.toLocaleDateString("en-GB", { weekday: "short" }); // "Mon"
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }); // "3 Mar"
}

function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtDistance(metres: number, sportType: string): string {
  if (metres <= 0) return "—";
  const cat = getSportCategory(sportType);
  if (cat === "swim") return `${Math.round(metres)}m`;
  return `${(metres / 1000).toFixed(1)}km`;
}

export default function RecentActivities({
  activities,
}: {
  activities: Activity[];
}) {
  if (activities.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <Header />
        <p className="text-text-muted text-sm text-center py-8">
          No activities yet — sync with Strava to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <Header />
      <ul className="space-y-0.5">
        {activities.map((a) => {
          const cat = getSportCategory(a.sportType);
          const color = SPORT_COLORS[cat];
          return (
            <li
              key={a.id}
              className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-bg/60 transition-colors group"
            >
              {/* Sport dot */}
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />

              {/* Date */}
              <span className="w-[68px] shrink-0 font-mono text-[11px] text-text-muted tabular-nums">
                {fmtRelativeDate(a.startDate)}
              </span>

              {/* Name */}
              <span className="flex-1 min-w-0 text-[13px] text-text-primary truncate">
                {a.name}
              </span>

              {/* Duration */}
              <span className="w-[52px] shrink-0 text-right font-mono text-[11px] text-text-muted tabular-nums">
                {fmtDuration(a.movingTime)}
              </span>

              {/* Distance */}
              <span className="w-[60px] shrink-0 text-right font-mono text-[11px] text-text-muted tabular-nums">
                {fmtDistance(a.distance, a.sportType)}
              </span>

              {/* TSS */}
              <span
                className="w-[32px] shrink-0 text-right font-mono text-[11px] tabular-nums"
                style={{ color }}
              >
                {Math.round(a.tss)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3 px-2 mb-1">
      <span className="w-1.5 shrink-0" />
      <span className="w-[68px] shrink-0 font-mono text-[9px] tracking-[0.15em] uppercase text-text-muted/60">
        Date
      </span>
      <span className="flex-1 font-mono text-[9px] tracking-[0.15em] uppercase text-text-muted/60">
        Activity
      </span>
      <span className="w-[52px] shrink-0 text-right font-mono text-[9px] tracking-[0.15em] uppercase text-text-muted/60">
        Time
      </span>
      <span className="w-[60px] shrink-0 text-right font-mono text-[9px] tracking-[0.15em] uppercase text-text-muted/60">
        Dist
      </span>
      <span className="w-[32px] shrink-0 text-right font-mono text-[9px] tracking-[0.15em] uppercase text-text-muted/60">
        TSS
      </span>
    </div>
  );
}
