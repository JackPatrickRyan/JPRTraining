import { prisma } from "@/lib/prisma";
import { getSportCategory } from "@/lib/tss";

// ─── CTL / ATL constants ──────────────────────────────────────────────────────

// Standard TrainingPeaks averaging windows
const CTL_DAYS = 42;
const ATL_DAYS = 7;

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Normalises a Date to UTC midnight of the same calendar day. */
export function toUTCMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

/** Returns an array of UTC-midnight dates from `start` to `end` inclusive. */
export function dateRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/** Returns the Monday (UTC midnight) of the ISO week containing `date`. */
function isoWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay() || 7; // Sun → 7, Mon → 1
  d.setUTCDate(d.getUTCDate() - day + 1);
  return toUTCMidnight(d);
}

/** Returns { year, week } ISO week number for a date. */
function isoWeekNumber(date: Date): { year: number; week: number } {
  const thursday = new Date(date);
  const day = thursday.getUTCDay() || 7;
  thursday.setUTCDate(thursday.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { year: thursday.getUTCFullYear(), week };
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface DayBuckets {
  totalTSS: number;
  bikeTSS: number;
  runTSS: number;
  swimTSS: number;
  otherTSS: number;
  totalTime: number;
}

const EMPTY_BUCKETS: DayBuckets = {
  totalTSS: 0, bikeTSS: 0, runTSS: 0, swimTSS: 0, otherTSS: 0, totalTime: 0,
};

// ─── Public return types ──────────────────────────────────────────────────────

export interface DailyMetricRow {
  date: Date;
  ctl: number;
  atl: number;
  tsb: number;
  totalTSS: number;
  bikeTSS: number;
  runTSS: number;
  swimTSS: number;
  otherTSS: number;
  totalTime: number;
}

export interface WeeklySummaryRow {
  weekStart: Date;
  year: number;
  week: number;
  totalTSS: number;
  bikeTSS: number;
  runTSS: number;
  swimTSS: number;
  otherTSS: number;
  totalTime: number;
}

export interface MetricsSummary {
  current: { ctl: number; atl: number; tsb: number; date: Date } | null;
  days: DailyMetricRow[];
  weeks: WeeklySummaryRow[];
}

// ─── CTL / ATL recalculation ──────────────────────────────────────────────────

/**
 * (Re)calculates DailyMetrics for `userId` from `fromDate` to today.
 *
 * Uses the standard TrainingPeaks rolling-average formulas:
 *   CTL_today = CTL_yesterday + (TSS_today − CTL_yesterday) / 42
 *   ATL_today = ATL_yesterday + (TSS_today − ATL_yesterday) / 7
 *   TSB       = CTL − ATL
 *
 * If `fromDate` is omitted the recalculation starts from the user's earliest
 * activity (CTL and ATL seed to 0). When provided, seed values are loaded
 * from the DailyMetrics row for the day before `fromDate`.
 */
export async function calculateDailyMetrics(
  userId: string,
  fromDate?: Date
): Promise<void> {
  const today = toUTCMidnight(new Date());

  // ── Determine start date ──────────────────────────────────────────────────
  let from: Date;
  let seedCTL = 0;
  let seedATL = 0;

  if (fromDate) {
    from = toUTCMidnight(fromDate);

    // Load CTL/ATL from the day immediately before the recalc window
    const dayBefore = new Date(from);
    dayBefore.setUTCDate(dayBefore.getUTCDate() - 1);
    const seed = await prisma.dailyMetrics.findFirst({
      where: { userId, date: dayBefore },
    });
    seedCTL = seed?.ctl ?? 0;
    seedATL = seed?.atl ?? 0;
  } else {
    // Full recalculation — start from earliest activity
    const earliest = await prisma.activity.findFirst({
      where: { userId },
      orderBy: { startDate: "asc" },
      select: { startDate: true },
    });

    if (!earliest) return; // no activities yet

    from = toUTCMidnight(earliest.startDate);
  }

  if (from > today) return;

  // ── Load activities in the recalc window ──────────────────────────────────
  const activities = await prisma.activity.findMany({
    where: { userId, startDate: { gte: from } },
    orderBy: { startDate: "asc" },
  });

  // ── Group TSS by UTC date ─────────────────────────────────────────────────
  const byDate = new Map<string, DayBuckets>();

  for (const act of activities) {
    const key = toUTCMidnight(act.startDate).toISOString();
    if (!byDate.has(key)) byDate.set(key, { ...EMPTY_BUCKETS });

    const bucket = byDate.get(key)!;
    const cat = getSportCategory(act.sportType);
    bucket.totalTSS += act.tss;
    bucket[`${cat}TSS`] += act.tss;
    bucket.totalTime += act.movingTime;
  }

  // ── Walk every calendar day, carry CTL/ATL forward ───────────────────────
  let ctl = seedCTL;
  let atl = seedATL;

  for (const date of dateRange(from, today)) {
    const key = date.toISOString();
    const buckets = byDate.get(key) ?? { ...EMPTY_BUCKETS };

    ctl = ctl + (buckets.totalTSS - ctl) / CTL_DAYS;
    atl = atl + (buckets.totalTSS - atl) / ATL_DAYS;
    const tsb = ctl - atl;

    await prisma.dailyMetrics.upsert({
      where: { userId_date: { userId, date } },
      update: { ...buckets, ctl, atl, tsb },
      create: { userId, date, ...buckets, ctl, atl, tsb },
    });
  }
}

// ─── Query helpers ────────────────────────────────────────────────────────────

/**
 * Returns the most recent `days` days of DailyMetrics for `userId`,
 * plus the current CTL / ATL / TSB snapshot and per-week aggregations
 * suitable for charting.
 */
export async function getMetricsSummary(
  userId: string,
  days: number
): Promise<MetricsSummary> {
  const cutoff = toUTCMidnight(
    new Date(Date.now() - (days - 1) * 86_400_000)
  );

  const rows = await prisma.dailyMetrics.findMany({
    where: { userId, date: { gte: cutoff } },
    orderBy: { date: "asc" },
  });

  const dailyRows: DailyMetricRow[] = rows.map((r) => ({
    date: r.date,
    ctl: r.ctl,
    atl: r.atl,
    tsb: r.tsb,
    totalTSS: r.totalTSS,
    bikeTSS: r.bikeTSS,
    runTSS: r.runTSS,
    swimTSS: r.swimTSS,
    otherTSS: r.otherTSS,
    totalTime: r.totalTime,
  }));

  const latest = rows.at(-1);
  const current = latest
    ? { ctl: latest.ctl, atl: latest.atl, tsb: latest.tsb, date: latest.date }
    : null;

  const weeks = aggregateWeeks(dailyRows);

  return { current, days: dailyRows, weeks };
}

/**
 * Returns the most recent `weeks` ISO weeks of aggregated training load.
 */
export async function getWeeklySummary(
  userId: string,
  weeks: number
): Promise<WeeklySummaryRow[]> {
  const cutoff = toUTCMidnight(
    new Date(Date.now() - weeks * 7 * 86_400_000)
  );

  const rows = await prisma.dailyMetrics.findMany({
    where: { userId, date: { gte: cutoff } },
    orderBy: { date: "asc" },
  });

  return aggregateWeeks(
    rows.map((r) => ({
      date: r.date,
      ctl: r.ctl,
      atl: r.atl,
      tsb: r.tsb,
      totalTSS: r.totalTSS,
      bikeTSS: r.bikeTSS,
      runTSS: r.runTSS,
      swimTSS: r.swimTSS,
      otherTSS: r.otherTSS,
      totalTime: r.totalTime,
    }))
  );
}

// ─── Internal aggregation ─────────────────────────────────────────────────────

function aggregateWeeks(days: DailyMetricRow[]): WeeklySummaryRow[] {
  const weekMap = new Map<string, WeeklySummaryRow>();

  for (const day of days) {
    const monday = isoWeekMonday(day.date);
    const key = monday.toISOString();

    if (!weekMap.has(key)) {
      const { year, week } = isoWeekNumber(day.date);
      weekMap.set(key, {
        weekStart: monday,
        year,
        week,
        totalTSS: 0,
        bikeTSS: 0,
        runTSS: 0,
        swimTSS: 0,
        otherTSS: 0,
        totalTime: 0,
      });
    }

    const w = weekMap.get(key)!;
    w.totalTSS += day.totalTSS;
    w.bikeTSS += day.bikeTSS;
    w.runTSS += day.runTSS;
    w.swimTSS += day.swimTSS;
    w.otherTSS += day.otherTSS;
    w.totalTime += day.totalTime;
  }

  return Array.from(weekMap.values()).sort(
    (a, b) => a.weekStart.getTime() - b.weekStart.getTime()
  );
}
