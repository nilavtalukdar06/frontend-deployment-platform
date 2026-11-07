import { queryOptions } from "@tanstack/react-query";
import { request } from "@/lib/axios";

export const analyticsRanges = ["24h", "7d", "30d"] as const;

export type AnalyticsRange = (typeof analyticsRanges)[number];

export interface RouteViews {
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
    peakHour: { hour: string; views: number } | null;
    topRoute: RouteViews | null;
  };
  viewsPerHour: { hour: string; views: number }[];
  routeDistribution: RouteViews[];
}

export const getProjectAnalytics = (
  projectId: string,
  range: AnalyticsRange,
  signal?: AbortSignal,
) =>
  request<ProjectAnalytics>({
    url: `/analytics/projects/${projectId}`,
    params: { range },
    signal,
  });

export const analyticsQueryOptions = (
  projectId: string,
  range: AnalyticsRange,
) =>
  queryOptions({
    queryKey: ["analytics", projectId, range] as const,
    queryFn: ({ signal }) => getProjectAnalytics(projectId, range, signal),
    staleTime: 60_000,
  });
