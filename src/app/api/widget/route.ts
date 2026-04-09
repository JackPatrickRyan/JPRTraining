import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMetricsSummary, toUTCMidnight } from "@/lib/metrics";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function thisWeekMonday(): Date {
  const now = new Date();
  const day = now.getUTCDay() || 7;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - day + 1);
  return toUTCMidnight(monday);
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.WIDGET_API_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findFirst({ select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [metrics, lastActivity, settings] = await Promise.all([
    getMetricsSummary(user.id, 14),
    prisma.activity.findFirst({
      where: { userId: user.id },
      orderBy: { startDate: "desc" },
      select: { startDate: true },
    }),
    prisma.userSettings.findUnique({
      where: { userId: user.id },
      select: { nextRaceName: true, nextRaceDate: true },
    }),
  ]);

  const monday = thisWeekMonday();
  const currentWeek = metrics.weeks.find(
    (w) => w.weekStart.getTime() === monday.getTime()
  );

  let daysToRace: number | null = null;
  if (settings?.nextRaceDate) {
    const today = toUTCMidnight(new Date());
    const race = toUTCMidnight(settings.nextRaceDate);
    daysToRace = Math.round((race.getTime() - today.getTime()) / 86400000);
  }

  return NextResponse.json({
    ctl: metrics.current ? Math.round(metrics.current.ctl * 10) / 10 : 0,
    atl: metrics.current ? Math.round(metrics.current.atl * 10) / 10 : 0,
    tsb: metrics.current ? Math.round(metrics.current.tsb * 10) / 10 : 0,
    weekTSS: Math.round(currentWeek?.totalTSS ?? 0),
    weekTime: formatTime(currentWeek?.totalTime ?? 0),
    lastSync: lastActivity?.startDate.toISOString() ?? null,
    raceName: settings?.nextRaceName ?? null,
    daysToRace,
  });
}
