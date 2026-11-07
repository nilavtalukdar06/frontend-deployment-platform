import { addHours, format, startOfDay } from "date-fns";
import type {
  AnalyticsRange,
  ProjectAnalytics,
} from "@/features/analytics/api";

export interface ViewsBucket {
  key: string;
  start: number;
  label: string;
  rangeLabel: string;
  views: number;
}

export const rangeLabels: Record<AnalyticsRange, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

export const rangeHints: Record<AnalyticsRange, string> = {
  "24h": "last 24 hours",
  "7d": "last 7 days",
  "30d": "last 30 days",
};

export const formatHourRange = (hour: string) => {
  const start = new Date(hour);
  const end = addHours(start, 1);

  return `${format(start, "MMM d, h:mm")} – ${format(end, "h:mm a")}`;
};

const hourlyBuckets = (analytics: ProjectAnalytics): ViewsBucket[] =>
  analytics.viewsPerHour.map((point) => {
    const start = new Date(point.hour);

    return {
      key: point.hour,
      start: start.getTime(),
      label: format(start, "h a"),
      rangeLabel: formatHourRange(point.hour),
      views: point.views,
    };
  });

const dailyBuckets = (analytics: ProjectAnalytics): ViewsBucket[] => {
  const days = new Map<number, number>();

  for (const point of analytics.viewsPerHour) {
    const day = startOfDay(new Date(point.hour)).getTime();
    days.set(day, (days.get(day) ?? 0) + point.views);
  }

  return Array.from(days, ([start, views]) => ({
    key: String(start),
    start,
    label: format(start, "MMM d"),
    rangeLabel: format(start, "EEE, MMM d"),
    views,
  })).sort((left, right) => left.start - right.start);
};

export const bucketViews = (analytics: ProjectAnalytics): ViewsBucket[] =>
  analytics.range === "24h"
    ? hourlyBuckets(analytics)
    : dailyBuckets(analytics);

export const peakBucketIndex = (buckets: readonly ViewsBucket[]) => {
  let peak = -1;
  let max = 0;

  buckets.forEach((bucket, index) => {
    if (bucket.views > max) {
      max = bucket.views;
      peak = index;
    }
  });

  return peak;
};
