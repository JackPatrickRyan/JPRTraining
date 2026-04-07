// ─── User settings ────────────────────────────────────────────────────────────

export interface UserSettings {
  /** Functional threshold power in watts */
  cycleFTP: number;
  /** Threshold run pace in seconds per km (default 270 = 4:30/km) */
  runThresholdPace: number;
  /** Critical swim speed in seconds per 100m (default 95 ≈ 1:35/100m) */
  swimCSS: number;
  /** Resting heart rate in bpm */
  restingHR: number;
  /** Maximum heart rate in bpm */
  maxHR: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  cycleFTP: 200,
  runThresholdPace: 270,
  swimCSS: 95,
  restingHR: 45,
  maxHR: 190,
};

// ─── Sport classification ─────────────────────────────────────────────────────

export type SportCategory = "bike" | "run" | "swim" | "other";

const BIKE_TYPES = new Set([
  "Ride", "VirtualRide", "EBikeRide", "Handcycle",
  "MountainBikeRide", "GravelRide",
]);
const RUN_TYPES = new Set(["Run", "VirtualRun", "TrailRun", "Treadmill"]);
const SWIM_TYPES = new Set(["Swim", "OpenWaterSwim"]);

export function getSportCategory(sportType: string): SportCategory {
  if (BIKE_TYPES.has(sportType)) return "bike";
  if (RUN_TYPES.has(sportType)) return "run";
  if (SWIM_TYPES.has(sportType)) return "swim";
  return "other";
}

// ─── Input type ───────────────────────────────────────────────────────────────

export interface TSSInput {
  sportType: string;
  movingTime: number;           // seconds
  distance: number;             // metres
  totalElevationGain: number;   // metres
  averageSpeed: number;         // m/s
  averageHeartrate?: number | null;
  weightedAverageWatts?: number | null;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

/**
 * Coggan HR-based TSS estimate.
 * Equivalent to: duration_hours × (avgHR / LTHR)² × 100
 */
function hrTSS(movingTime: number, avgHR: number, lthr: number): number {
  const IF = avgHR / lthr;
  return (movingTime * IF * IF) / 3600 * 100;
}

/** Derives LTHR from max HR using Friel's ~87% approximation. */
function deriveLTHR(settings: UserSettings): number {
  return settings.maxHR * 0.87;
}

// ─── Sport-specific calculators ───────────────────────────────────────────────

/**
 * Cycling TSS.
 *
 * With power: TSS = (t × NP × IF) / (FTP × 3600) × 100
 *   where IF = NP / FTP
 *
 * Without power: falls back to HR-based, then duration estimate.
 */
function calculateCyclingTSS(a: TSSInput, s: UserSettings): number {
  if (a.weightedAverageWatts) {
    const ftp = s.cycleFTP;
    const np = a.weightedAverageWatts;
    const IF = np / ftp;
    return (a.movingTime * np * IF) / (ftp * 3600) * 100;
  }

  if (a.averageHeartrate) {
    return hrTSS(a.movingTime, a.averageHeartrate, deriveLTHR(s));
  }

  return (a.movingTime / 3600) * 50;
}

/**
 * Running rTSS based on Normalised Graded Pace (NGP).
 *
 *   NGP  = averageSpeed × (1 + (elevationGain / distance) × 1.5)
 *   IF   = NGP / rFTPa
 *   rTSS = (t × NGP × IF) / (rFTPa × 3600) × 100
 *
 * Falls back to HR-based or duration estimate when distance is unavailable.
 */
function calculateRunTSS(a: TSSInput, s: UserSettings): number {
  // rFTPa: threshold pace in m/s converted from sec/km
  const rFTPa = 1000 / s.runThresholdPace;

  if (a.distance > 0) {
    const gradeAdjustment = 1 + (a.totalElevationGain / a.distance) * 1.5;
    const ngp = a.averageSpeed * gradeAdjustment;
    const IF = ngp / rFTPa;
    return (a.movingTime * ngp * IF) / (rFTPa * 3600) * 100;
  }

  // No distance data (treadmill without GPS, etc.)
  if (a.averageHeartrate) {
    return hrTSS(a.movingTime, a.averageHeartrate, deriveLTHR(s));
  }

  return (a.movingTime / 3600) * 60;
}

/**
 * Swimming sTSS based on Critical Swim Speed (CSS).
 *
 *   pace  = movingTime / (distance / 100)   — seconds per 100m
 *   IF    = CSS / pace                       — faster swim → higher IF
 *   sTSS  = (t × IF²) / 3600 × 100
 *
 * Falls back to duration estimate when distance is unavailable.
 */
function calculateSwimTSS(a: TSSInput, s: UserSettings): number {
  if (a.distance > 0) {
    const pace = a.movingTime / (a.distance / 100); // sec / 100m
    const IF = s.swimCSS / pace;
    return (a.movingTime * IF * IF) / 3600 * 100;
  }

  return (a.movingTime / 3600) * 60;
}

/**
 * Generic TSS for non-aerobic activities (weights, yoga, etc.).
 *
 * With HR: Coggan hrTSS formula.
 * Without HR: conservative 40 TSS/hr estimate.
 */
function calculateOtherTSS(a: TSSInput, s: UserSettings): number {
  if (a.averageHeartrate) {
    return hrTSS(a.movingTime, a.averageHeartrate, deriveLTHR(s));
  }

  return (a.movingTime / 3600) * 40;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Calculates TSS for an activity, routing to the appropriate
 * sport-specific formula based on sportType.
 */
export function calculateTSS(
  activity: TSSInput,
  settings: UserSettings = DEFAULT_SETTINGS
): number {
  const tss = (() => {
    switch (getSportCategory(activity.sportType)) {
      case "bike":  return calculateCyclingTSS(activity, settings);
      case "run":   return calculateRunTSS(activity, settings);
      case "swim":  return calculateSwimTSS(activity, settings);
      default:      return calculateOtherTSS(activity, settings);
    }
  })();

  // Guard against NaN / negative values from bad Strava data
  return Number.isFinite(tss) && tss >= 0 ? tss : 0;
}
