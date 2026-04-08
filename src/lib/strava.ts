import { prisma } from "@/lib/prisma";
import { calculateTSS, DEFAULT_SETTINGS, type UserSettings } from "@/lib/tss";
import { calculateDailyMetrics } from "@/lib/metrics";

// ─── Constants ────────────────────────────────────────────────────────────────

const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STRAVA_API_BASE = "https://www.strava.com/api/v3";

const EXPIRY_BUFFER_S = 5 * 60;
const PAGE_DELAY_MS = 500; // stay well within Strava's 200 req/15 min limit

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StravaActivity {
  id: number;
  name: string;
  sport_type: string;
  start_date: string; // ISO 8601 UTC
  start_date_local: string; // ISO 8601 local time
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  distance: number; // metres
  total_elevation_gain: number; // metres
  average_heartrate?: number;
  max_heartrate?: number;
  average_speed: number; // m/s
  weighted_average_watts?: number;
  suffer_score?: number;
}

interface StravaRefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface SyncSummary {
  newActivities: number;
  updatedActivities: number;
}

// ─── Token management ─────────────────────────────────────────────────────────

/**
 * Returns a valid Strava access token for the given user,
 * refreshing if it has expired or is about to expire.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const nowS = Math.floor(Date.now() / 1000);
  if (user.tokenExpiresAt - nowS >= EXPIRY_BUFFER_S) {
    return user.accessToken;
  }

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: user.refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Strava token refresh failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as StravaRefreshResponse;

  await prisma.user.update({
    where: { id: userId },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: data.expires_at,
    },
  });

  return data.access_token;
}

// ─── API fetching ─────────────────────────────────────────────────────────────

/**
 * Fetches one page of activities from the Strava API.
 * `after` / `before` are Unix timestamps (seconds).
 */
export async function fetchActivities(
  accessToken: string,
  after?: number,
  before?: number,
  page = 1,
  perPage = 200
): Promise<StravaActivity[]> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (after !== undefined) params.set("after", String(after));
  if (before !== undefined) params.set("before", String(before));

  const res = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    throw new Error(`Strava API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<StravaActivity[]>;
}

/**
 * Fetches all activities since `since` (defaults to 12 months ago),
 * paginating automatically and respecting Strava rate limits.
 */
export async function fetchAllActivities(
  accessToken: string,
  since?: Date
): Promise<StravaActivity[]> {
  const after = Math.floor(
    (since ?? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)).getTime() / 1000
  );

  const all: StravaActivity[] = [];
  let page = 1;

  while (true) {
    const batch = await fetchActivities(accessToken, after, undefined, page, 200);
    all.push(...batch);

    if (batch.length < 200) break; // last page

    page++;
    await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
  }

  return all;
}

// ─── DailyMetrics recalculation ───────────────────────────────────────────────

/**
 * Thin wrapper — delegates to calculateDailyMetrics in metrics.ts.
 * Kept here so webhook/sync callers don't need to change their imports.
 */
export async function recalculateDailyMetrics(
  userId: string,
  fromDate: Date
): Promise<void> {
  await calculateDailyMetrics(userId, fromDate);
}

/**
 * Fetches a single detailed activity from the Strava API.
 */
export async function fetchActivity(
  accessToken: string,
  activityId: number
): Promise<StravaActivity> {
  const res = await fetch(`${STRAVA_API_BASE}/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Strava API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<StravaActivity>;
}

/**
 * Calculates TSS and upserts a single Strava activity for a user.
 * Does NOT recalculate DailyMetrics — call recalculateDailyMetrics separately.
 */
export async function upsertActivity(
  userId: string,
  raw: StravaActivity,
  settings: UserSettings = DEFAULT_SETTINGS
): Promise<void> {
  const tss = calculateTSS({
    sportType: raw.sport_type,
    movingTime: raw.moving_time,
    distance: raw.distance,
    totalElevationGain: raw.total_elevation_gain,
    averageSpeed: raw.average_speed,
    averageHeartrate: raw.average_heartrate,
    weightedAverageWatts: raw.weighted_average_watts,
  }, settings);
  const data = {
    userId,
    name: raw.name,
    sportType: raw.sport_type,
    startDate: new Date(raw.start_date),
    movingTime: raw.moving_time,
    elapsedTime: raw.elapsed_time,
    distance: raw.distance,
    totalElevationGain: raw.total_elevation_gain,
    averageHeartrate: raw.average_heartrate ?? null,
    maxHeartrate: raw.max_heartrate ?? null,
    averageSpeed: raw.average_speed,
    weightedAverageWatts: raw.weighted_average_watts ?? null,
    sufferScore: raw.suffer_score ?? null,
    tss,
  };

  await prisma.activity.upsert({
    where: { stravaId: BigInt(raw.id) },
    update: data,
    create: { stravaId: BigInt(raw.id), ...data },
  });
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

/**
 * Syncs Strava activities for a user into the database.
 * - Fetches from the most recent stored activity date (or 12 months).
 * - Upserts each activity and calculates TSS.
 * - Recalculates DailyMetrics from the earliest new activity.
 */
export async function syncActivities(userId: string): Promise<SyncSummary> {
  const accessToken = await getValidAccessToken(userId);

  const dbSettings = await prisma.userSettings.findUnique({ where: { userId } });
  const settings: UserSettings = dbSettings ?? DEFAULT_SETTINGS;

  // Find the most recent activity we already have
  const latest = await prisma.activity.findFirst({
    where: { userId },
    orderBy: { startDate: "desc" },
    select: { startDate: true },
  });

  const since = latest?.startDate ?? undefined;
  const stravaActivities = await fetchAllActivities(accessToken, since);

  if (stravaActivities.length === 0) {
    return { newActivities: 0, updatedActivities: 0 };
  }

  // Determine which stravaIds already exist so we can count new vs updated
  const incomingIds = stravaActivities.map((a) => BigInt(a.id));
  const existing = await prisma.activity.findMany({
    where: { userId, stravaId: { in: incomingIds } },
    select: { stravaId: true },
  });
  const existingIds = new Set(existing.map((a) => a.stravaId.toString()));

  let newActivities = 0;
  let updatedActivities = 0;

  for (const raw of stravaActivities) {
    await upsertActivity(userId, raw, settings);

    if (existingIds.has(String(raw.id))) {
      updatedActivities++;
    } else {
      newActivities++;
    }
  }

  // Recalculate DailyMetrics from the earliest activity we touched
  const earliestDate = stravaActivities.reduce((min, a) => {
    const d = new Date(a.start_date);
    return d < min ? d : min;
  }, new Date(stravaActivities[0].start_date));

  await recalculateDailyMetrics(userId, earliestDate);

  return { newActivities, updatedActivities };
}
