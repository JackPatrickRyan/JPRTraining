import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { syncActivities } from "@/lib/strava";
import { calculateDailyMetrics } from "@/lib/metrics";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const full = searchParams.get("full") === "true";

  try {
    const summary = await syncActivities(session.user.id);

    if (full) {
      await calculateDailyMetrics(session.user.id);
    }

    return NextResponse.json(summary);
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
