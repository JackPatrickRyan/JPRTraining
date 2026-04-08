import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMetricsSummary } from "@/lib/metrics";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(
    365,
    Math.max(7, parseInt(searchParams.get("days") ?? "84"))
  );

  const summary = await getMetricsSummary(session.user.id, days);

  return NextResponse.json({
    current: summary.current
      ? { ...summary.current, date: summary.current.date.toISOString() }
      : null,
    days: summary.days.map((d) => ({ ...d, date: d.date.toISOString() })),
    weeks: summary.weeks.map((w) => ({
      ...w,
      weekStart: w.weekStart.toISOString(),
    })),
  });
}
