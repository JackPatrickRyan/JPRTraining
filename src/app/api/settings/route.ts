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
    type ActivityRow = (typeof activities)[number];
    // Compute TSS in JS, then bulk-update in a single SQL statement
    const values = activities
      .map((act: ActivityRow) => {
        const tss = calculateTSS(
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
        );
        // act.id is a cuid (alphanumeric + hyphens), tss is a JS number — safe to inline
        return `('${act.id}', ${tss})`;
      })
      .join(", ");

    await prisma.$executeRawUnsafe(`
      UPDATE "Activity" AS a
      SET tss = v.tss::float8
      FROM (VALUES ${values}) AS v(id, tss)
      WHERE a.id = v.id
    `);

    await calculateDailyMetrics(session.user.id);
  }

  return NextResponse.json({ ok: true });
}
