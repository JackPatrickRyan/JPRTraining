"use client";

import { useEffect, useState } from "react";
import HeroMetrics from "./HeroMetrics";
import FitnessChart from "./FitnessChart";
import WeeklyChart from "./WeeklyChart";
import RecentActivities from "./RecentActivities";

export type DayRow = {
  date: string;
  ctl: number;
  atl: number;
  tsb: number;
  totalTSS: number;
  bikeTSS: number;
  runTSS: number;
  swimTSS: number;
  otherTSS: number;
  totalTime: number;
};

export type WeekRow = {
  weekStart: string;
  year: number;
  week: number;
  totalTSS: number;
  bikeTSS: number;
  runTSS: number;
  swimTSS: number;
  otherTSS: number;
  totalTime: number;
};

export type ActivityRow = {
  id: string;
  name: string;
  sportType: string;
  startDate: string;
  movingTime: number;
  distance: number;
  tss: number;
};

type MetricsResponse = {
  current: { ctl: number; atl: number; tsb: number; date: string } | null;
  days: DayRow[];
  weeks: WeekRow[];
};

export default function DashboardContent() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [activities, setActivities] = useState<ActivityRow[] | null>(null);

  useEffect(() => {
    fetch("/api/metrics?days=84")
      .then((r) => r.json())
      .then(setMetrics)
      .catch(console.error);

    fetch("/api/activities")
      .then((r) => r.json())
      .then(setActivities)
      .catch(console.error);
  }, []);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm font-mono tracking-wider">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
      <HeroMetrics current={metrics.current} days={metrics.days} />
      <FitnessChart days={metrics.days} />
      <WeeklyChart weeks={metrics.weeks} />
      <RecentActivities activities={activities ?? []} />
    </div>
  );
}
