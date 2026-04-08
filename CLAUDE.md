# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # start development server
npm run build        # prisma generate + next build
npx prisma migrate dev   # apply schema changes locally
npx prisma studio        # browse/edit the database
npx prisma generate      # regenerate client after schema changes
```

No test runner is configured. There is no lint script in package.json.

## Git workflow

After making file changes, always commit and push to git:

```bash
git add <changed files>
git commit -m "description"
git push
```

## Environment variables

Required in `.env.local`:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `NEXTAUTH_SECRET` | NextAuth session signing key |
| `NEXTAUTH_URL` | Full URL of the app (e.g. `http://localhost:3000`) |
| `STRAVA_CLIENT_ID` | Strava OAuth app client ID |
| `STRAVA_CLIENT_SECRET` | Strava OAuth app client secret |
| `STRAVA_WEBHOOK_VERIFY_TOKEN` | Arbitrary secret used to verify Strava webhook subscriptions |
| `WIDGET_API_KEY` | Bearer token for the personal widget endpoint (`/api/widget`) |

## Architecture

This is a Next.js 16 App Router application (React 19). The stack is: **Next.js + Prisma + Neon Postgres + NextAuth + Recharts + Tailwind CSS v4**.

### Data flow

```
Strava API ──► /api/webhook/strava  (real-time activity events)
             ──► /api/sync           (manual full sync, POST)
             ──► /api/cron/sync      (daily cron at 18:00 UTC, vercel.json)
                     │
                     ▼
              lib/strava.ts          token refresh + fetch + upsertActivity
                     │
                     ▼
              lib/tss.ts             sport-specific TSS calculation
                     │
                     ▼
              lib/metrics.ts         CTL/ATL/TSB recalculation → DailyMetrics table
                     │
                     ▼
              /api/metrics           served to dashboard charts
```

### Key library files

- **`src/lib/strava.ts`** — Strava token refresh, paginated activity fetching, `upsertActivity`, `syncActivities`. All Strava API interaction lives here.
- **`src/lib/tss.ts`** — TSS calculation per sport type (cycling uses power/HR, running uses NGP, swimming uses CSS). Contains `UserSettings` interface and `DEFAULT_SETTINGS`.
- **`src/lib/metrics.ts`** — `calculateDailyMetrics` does a full CTL/ATL recalculation via a single bulk `$executeRawUnsafe` upsert. Also exports `getMetricsSummary` and `getWeeklySummary` for the dashboard.
- **`src/lib/auth.ts`** — NextAuth config with Strava OAuth provider. On sign-in, upserts a `User` row and stores the Strava tokens. JWT strategy; `session.user.id` is the internal DB id.
- **`src/lib/prisma.ts`** — Prisma client singleton using `PrismaNeon` adapter (HTTP-based, serverless-safe).

### Database schema (Prisma)

- `User` — Strava OAuth tokens, linked to activities and settings
- `UserSettings` — per-user thresholds (FTP, run pace, swim CSS, HR zones) used for TSS calculation
- `Activity` — one row per Strava activity, includes calculated `tss` field
- `DailyMetrics` — daily aggregated TSS by sport + CTL/ATL/TSB, unique on `(userId, date)`

### Prisma config

Schema and datasource URL are configured via `prisma.config.ts` (uses `dotenv/config` to load `.env.local`). The datasource in `prisma/schema.prisma` has no `url` field — it is injected at runtime via `prisma.config.ts`.

### API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth Strava OAuth |
| `/api/sync` | POST | Manual activity sync for authenticated user |
| `/api/cron/sync` | GET | Vercel cron job — syncs all users |
| `/api/activities` | GET | List activities for authenticated user |
| `/api/metrics` | GET | CTL/ATL/TSB + weekly summaries for dashboard |
| `/api/settings` | GET/POST | Read/update `UserSettings` |
| `/api/webhook/strava` | GET/POST | Strava webhook (GET = challenge verification, POST = events) |

### Strava webhook

The webhook route at `/api/webhook/strava` handles real-time activity `create`, `update`, and `delete` events. Strava verifies the subscription endpoint with a `hub.verify_token` challenge (GET). After any activity change, `recalculateDailyMetrics` is called from the affected date forward to keep CTL/ATL correct.
