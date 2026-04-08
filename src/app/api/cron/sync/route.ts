import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncActivities } from "@/lib/strava";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({ select: { id: true } });

  const results = await Promise.allSettled(
    users.map((u) => syncActivities(u.id))
  );

  const summary = results.map((r, i) => ({
    userId: users[i].id,
    status: r.status,
    ...(r.status === "fulfilled" ? r.value : { error: String((r as PromiseRejectedResult).reason) }),
  }));

  return NextResponse.json({ synced: users.length, summary });
}
