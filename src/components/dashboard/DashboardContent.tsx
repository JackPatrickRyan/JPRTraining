"use client";

import { useEffect, useState } from "react";
import HeroMetrics from "./HeroMetrics";
import FitnessChart from "./FitnessChart";
import WeeklyChart from "./WeeklyChart";
import RecentActivities from "./RecentActivities";
import NextRaceCard from "./NextRaceCard";
import WeekSummaryCard from "./WeekSummaryCard";

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

type RaceSettings = {
  nextRaceName: string | null;
  nextRaceDate: string | null;
};

export default function DashboardContent() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [activities, setActivities] = useState<ActivityRow[] | null>(null);
  const [race, setRace] = useState<RaceSettings>({ nextRaceName: null, nextRaceDate: null });

  function fetchData() {
    fetch("/api/metrics?days=84")
      .then((r) => r.json())
      .then(setMetrics)
      .catch(console.error);

    fetch("/api/activities")
      .then((r) => r.json())
      .then(setActivities)
      .catch(console.error);
  }

  function fetchRace() {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => setRace({ nextRaceName: s.nextRaceName ?? null, nextRaceDate: s.nextRaceDate ?? null }))
      .catch(console.error);
  }

  useEffect(() => {
    fetchData();
    fetchRace();
    window.addEventListener("settings-saved", fetchData);
    window.addEventListener("sync-complete", fetchData);
    return () => {
      window.removeEventListener("settings-saved", fetchData);
      window.removeEventListener("sync-complete", fetchData);
    };
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
      <NextRaceCard
        nextRaceName={race.nextRaceName}
        nextRaceDate={race.nextRaceDate}
        onSaved={fetchRace}
      />
      <FitnessChart days={metrics.days} />
      <WeeklyChart weeks={metrics.weeks} />
      <RecentActivities activities={activities ?? []} />
    </div>
  );
}
