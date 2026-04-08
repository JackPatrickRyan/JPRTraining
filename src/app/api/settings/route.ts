import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS } from "@/lib/tss";
import { upsertActivity } from "@/lib/strava";
import { calculateDailyMetrics } from "@/lib/metrics";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(settings ?? { ...DEFAULT_SETTINGS });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { cycleFTP, runThresholdPace, swimCSS, restingHR, maxHR } = body;

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: { cycleFTP, runThresholdPace, swimCSS, restingHR, maxHR },
    create: {
      userId: session.user.id,
      cycleFTP,
      runThresholdPace,
      swimCSS,
      restingHR,
      maxHR,
    },
  });

  // Recalculate TSS for all existing activities with the new settings
  const activities = await prisma.activity.findMany({
    where: { userId: session.user.id },
    orderBy: { startDate: "asc" },
  });

  for (const act of activities) {
    await upsertActivity(
      session.user.id,
      {
        id: Number(act.stravaId),
        name: act.name,
        sport_type: act.sportType,
        start_date: act.startDate.toISOString(),
        start_date_local: act.startDate.toISOString(),
        moving_time: act.movingTime,
        elapsed_time: act.elapsedTime,
        distance: act.distance,
        total_elevation_gain: act.totalElevationGain,
        average_heartrate: act.averageHeartrate ?? undefined,
        max_heartrate: act.maxHeartrate ?? undefined,
        average_speed: act.averageSpeed,
        weighted_average_watts: act.weightedAverageWatts ?? undefined,
        suffer_score: act.sufferScore ?? undefined,
      },
      settings
    );
  }

  if (activities.length > 0) {
    await calculateDailyMetrics(session.user.id);
  }

  return NextResponse.json({ ok: true });
}
