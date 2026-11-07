import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { ChartColumn } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  analyticsQueryOptions,
  analyticsRanges,
  type AnalyticsRange,
  type ProjectAnalytics,
} from "@/features/analytics/api";
import {
  bucketViews,
  formatHourRange,
  rangeHints,
  rangeLabels,
} from "@/features/analytics/buckets";
import { formatNumber, formatPercent, hostFromUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RoutesCard } from "@/pages/project/analytics/routes-card";
import { ViewsChartCard } from "@/pages/project/analytics/views-chart-card";
import { useProject } from "@/pages/project/project-context";

const rangeItems = analyticsRanges.map((value) => ({
  value,
  label: rangeLabels[value],
}));

const parseRange = (value: string | null): AnalyticsRange =>
  analyticsRanges.find((range) => range === value) ?? "24h";

function StatCard({
  label,
  value,
  hint,
  hintClassName,
}: {
  label: string;
  value: string;
  hint?: string;
  hintClassName?: string;
}) {
  return (
    <Card className="gap-1 p-4">
      <span className="text-label text-muted-foreground">{label}</span>
      <span className="truncate text-stat-lg font-medium tracking-tight">
        {value}
      </span>
      {hint ? (
        <span className={cn("text-xs text-subtle", hintClassName)}>{hint}</span>
      ) : null}
    </Card>
  );
}

function changeHint(analytics: ProjectAnalytics) {
  const change = analytics.stats.totalViews.changePercent;

  if (change === null) {
    return { text: rangeHints[analytics.range], className: undefined };
  }

  const sign = change > 0 ? "+" : "";

  return {
    text: `${sign}${change.toFixed(1)}% vs previous period`,
    className:
      change > 0 ? "text-success" : change < 0 ? "text-destructive" : undefined,
  };
}

function AnalyticsSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Loading analytics"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} className="gap-2 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-3 w-20" />
          </Card>
        ))}
      </div>
      <Card className="gap-4 p-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-72 w-full" />
      </Card>
      <Card className="gap-4 p-5">
        <Skeleton className="h-5 w-40" />
        <div className="flex items-center gap-8">
          <Skeleton className="size-56 rounded-full" />
          <div className="flex flex-1 flex-col gap-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        </div>
      </Card>
    </div>
  );
}

function AnalyticsContent({ analytics }: { analytics: ProjectAnalytics }) {
  const { stats } = analytics;
  const totalViews = stats.totalViews.value;
  const total = changeHint(analytics);

  if (totalViews === 0) {
    return (
      <EmptyState
        icon={ChartColumn}
        title="No page views yet"
        description={`Nobody has visited this site in the ${rangeHints[analytics.range]}. Views show up here within a minute of a visit.`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Page views"
          value={formatNumber(totalViews)}
          hint={total.text}
          hintClassName={total.className}
        />
        <StatCard
          label="Average per hour"
          value={formatNumber(Math.round(stats.averageViewsPerHour))}
          hint={`${stats.uniqueRoutes} unique ${stats.uniqueRoutes === 1 ? "route" : "routes"}`}
        />
        <StatCard
          label="Peak hour"
          value={stats.peakHour ? formatNumber(stats.peakHour.views) : "—"}
          hint={
            stats.peakHour ? formatHourRange(stats.peakHour.hour) : undefined
          }
        />
        <StatCard
          label="Top route"
          value={stats.topRoute?.route ?? "—"}
          hint={
            stats.topRoute
              ? `${formatPercent(stats.topRoute.percentage)} of views`
              : undefined
          }
        />
      </div>
      <ViewsChartCard
        range={analytics.range}
        buckets={bucketViews(analytics)}
        totalViews={totalViews}
      />
      <RoutesCard
        range={analytics.range}
        routes={analytics.routeDistribution}
        totalViews={totalViews}
      />
    </div>
  );
}

export default function AnalyticsPage() {
  const project = useProject();
  const [searchParams, setSearchParams] = useSearchParams();
  const range = parseRange(searchParams.get("range"));
  const { data, error, isPending, isError, refetch, isRefetching } = useQuery(
    analyticsQueryOptions(project.id, range),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl leading-8 font-semibold tracking-tight">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Traffic to{" "}
            <a
              href={project.url}
              target="_blank"
              rel="noreferrer"
              className="text-foreground hover:underline"
            >
              {hostFromUrl(project.url)}
            </a>
          </p>
        </div>
        <Select
          items={rangeItems}
          value={range}
          onValueChange={(next) => {
            if (next) {
              setSearchParams(next === "24h" ? {} : { range: next });
            }
          }}
        >
          <SelectTrigger className="min-w-40" aria-label="Time range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectGroup>
              {rangeItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <AnalyticsSkeleton />
      ) : isError ? (
        <ErrorState
          error={error}
          title="Couldn't load analytics"
          onRetry={() => void refetch()}
          isRetrying={isRefetching}
        />
      ) : (
        <AnalyticsContent analytics={data} />
      )}
    </div>
  );
}
