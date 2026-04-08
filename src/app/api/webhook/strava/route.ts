import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getValidAccessToken,
  fetchActivity,
  upsertActivity,
  recalculateDailyMetrics,
} from "@/lib/strava";
import { DEFAULT_SETTINGS } from "@/lib/tss";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StravaWebhookEvent {
  aspect_type: "create" | "update" | "delete";
  event_time: number;
  object_id: number; // activity ID
  object_type: "activity" | "athlete";
  owner_id: number; // Strava athlete ID
  subscription_id: number;
  updates: Record<string, string>;
}

// ─── GET — subscription verification challenge ────────────────────────────────

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const challenge = params.get("hub.challenge");
  const verifyToken = params.get("hub.verify_token");

  if (
    mode === "subscribe" &&
    challenge &&
    verifyToken === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN
  ) {
    return NextResponse.json({ "hub.challenge": challenge });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ─── POST — incoming activity events ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  let event: StravaWebhookEvent;

  try {
    event = (await req.json()) as StravaWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Only handle activity events; ignore athlete profile updates
  if (event.object_type !== "activity") {
    return NextResponse.json({ ok: true });
  }

  // Resolve the local user from the Strava athlete ID
  const user = await prisma.user.findUnique({
    where: { stravaId: String(event.owner_id) },
  });

  if (!user) {
    // Unknown athlete — not one of our users
    return NextResponse.json({ ok: true });
  }

  try {
    if (event.aspect_type === "create" || event.aspect_type === "update") {
      const accessToken = await getValidAccessToken(user.id);
      const raw = await fetchActivity(accessToken, event.object_id);
      await upsertActivity(user.id, raw);
      await recalculateDailyMetrics(user.id, new Date(raw.start_date));
    }

    if (event.aspect_type === "delete") {
      const existing = await prisma.activity.findUnique({
        where: { stravaId: BigInt(event.object_id) },
        select: { startDate: true },
      });

      if (existing) {
        await prisma.activity.delete({
          where: { stravaId: BigInt(event.object_id) },
        });
        await recalculateDailyMetrics(user.id, existing.startDate);
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    // Return 200 to prevent Strava retrying events we can't handle
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
