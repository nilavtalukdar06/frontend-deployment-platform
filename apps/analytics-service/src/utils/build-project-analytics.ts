import {
  OTHER_ROUTES_LABEL,
  type AnalyticsRange,
} from "../constants/analytics-range";
import type {
  HourlyViews,
  PeriodTotals,
  RouteViews,
} from "../repositories/page-view.repository";

const SECONDS_PER_HOUR = 3_600;

export interface HourlyViewsPoint {
  hour: string;
  views: number;
}

export interface RouteDistributionSlice {
  route: string;
  views: number;
  percentage: number;
}

export interface ProjectAnalytics {
  projectId: string;
  range: AnalyticsRange;
  from: string;
  to: string;
  stats: {
    totalViews: {
      value: number;
      previousValue: number;
      changePercent: number | null;
    };
    uniqueRoutes: number;
    averageViewsPerHour: number;
    peakHour: HourlyViewsPoint | null;
    topRoute: RouteDistributionSlice | null;
  };
  viewsPerHour: HourlyViewsPoint[];
  routeDistribution: RouteDistributionSlice[];
}

export interface BuildProjectAnalyticsInput {
  projectId: string;
  range: AnalyticsRange;
  hours: number;
  nowEpochSeconds: number;
  hourly: readonly HourlyViews[];
  topRoutes: readonly RouteViews[];
  totals: PeriodTotals;
}

const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const toIso = (epochSeconds: number): string =>
  new Date(epochSeconds * 1_000).toISOString();

export const currentHourStart = (nowEpochSeconds: number): number =>
  Math.floor(nowEpochSeconds / SECONDS_PER_HOUR) * SECONDS_PER_HOUR;

export const rangeStart = (nowEpochSeconds: number, hours: number): number =>
  currentHourStart(nowEpochSeconds) - (hours - 1) * SECONDS_PER_HOUR;

export const buildProjectAnalytics = ({
  projectId,
  range,
  hours,
  nowEpochSeconds,
  hourly,
  topRoutes,
  totals,
}: BuildProjectAnalyticsInput): ProjectAnalytics => {
  const from = rangeStart(nowEpochSeconds, hours);
  const viewsByHour = new Map(hourly.map((row) => [row.hour, row.views]));

  const viewsPerHour = Array.from({ length: hours }, (_, index) => {
    const hour = from + index * SECONDS_PER_HOUR;
    return { hour: toIso(hour), views: viewsByHour.get(hour) ?? 0 };
  });

  const totalViews = viewsPerHour.reduce((sum, point) => sum + point.views, 0);

  const peak = viewsPerHour.reduce<HourlyViewsPoint | null>(
    (best, point) => (point.views > (best?.views ?? 0) ? point : best),
    null,
  );

  const toSlice = (route: string, views: number): RouteDistributionSlice => ({
    route,
    views,
    percentage: totalViews === 0 ? 0 : roundTo((views / totalViews) * 100, 1),
  });

  const routeSlices = topRoutes.map(({ route, views }) =>
    toSlice(route, views),
  );
  const otherViews = Math.max(
    0,
    totalViews - topRoutes.reduce((sum, row) => sum + row.views, 0),
  );
  const routeDistribution =
    otherViews > 0
      ? [...routeSlices, toSlice(OTHER_ROUTES_LABEL, otherViews)]
      : routeSlices;

  return {
    projectId,
    range,
    from: toIso(from),
    to: toIso(nowEpochSeconds),
    stats: {
      totalViews: {
        value: totalViews,
        previousValue: totals.previousViews,
        changePercent:
          totals.previousViews === 0
            ? null
            : roundTo(
                ((totalViews - totals.previousViews) / totals.previousViews) *
                  100,
                1,
              ),
      },
      uniqueRoutes: totals.uniqueRoutes,
      averageViewsPerHour: roundTo(totalViews / hours, 1),
      peakHour: peak,
      topRoute: routeSlices[0] ?? null,
    },
    viewsPerHour,
    routeDistribution,
  };
};
