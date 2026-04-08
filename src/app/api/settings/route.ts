import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS, calculateTSS, type UserSettings } from "@/lib/tss";
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

  const settings: UserSettings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    update: { cycleFTP, runThresholdPace, swimCSS, restingHR, maxHR },
    create: { userId: session.user.id, cycleFTP, runThresholdPace, swimCSS, restingHR, maxHR },
  });

  // Recalculate TSS for all activities in one transaction
  const activities = await prisma.activity.findMany({
    where: { userId: session.user.id },
  });

  if (activities.length > 0) {
    await prisma.$transaction(
      activities.map((act) =>
        prisma.activity.update({
          where: { id: act.id },
          data: {
            tss: calculateTSS(
              {
                sportType: act.sportType,
                movingTime: act.movingTime,
                distance: act.distance,
                totalElevationGain: act.totalElevationGain,
                averageSpeed: act.averageSpeed,
                averageHeartrate: act.averageHeartrate,
                weightedAverageWatts: act.weightedAverageWatts,
              },
              settings
            ),
          },
        })
      )
    );

    await calculateDailyMetrics(session.user.id);
  }

  return NextResponse.json({ ok: true });
}
