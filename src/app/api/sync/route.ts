import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { syncActivities } from "@/lib/strava";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await syncActivities(session.user.id);
    return NextResponse.json(summary);
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
