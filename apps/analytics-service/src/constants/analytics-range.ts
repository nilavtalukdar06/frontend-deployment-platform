export const analyticsRanges = ["24h", "7d", "30d"] as const;

export type AnalyticsRange = (typeof analyticsRanges)[number];

export const DEFAULT_ANALYTICS_RANGE: AnalyticsRange = "24h";

export const ANALYTICS_RANGE_HOURS: Record<AnalyticsRange, number> = {
  "24h": 24,
  "7d": 7 * 24,
  "30d": 30 * 24,
};

export const TOP_ROUTES_LIMIT = 5;

export const OTHER_ROUTES_LABEL = "Other";
