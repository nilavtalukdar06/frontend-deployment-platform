import { Cell, Pie, PieChart } from "recharts";
import { Card } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AnalyticsRange, RouteViews } from "@/features/analytics/api";
import { rangeHints } from "@/features/analytics/buckets";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const ROUTE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];

const chartConfig = {
  views: { label: "Views" },
} satisfies ChartConfig;

const isRoute = (route: string) => route.startsWith("/");

function RoutesCard({
  range,
  routes,
  totalViews,
}: {
  range: AnalyticsRange;
  routes: RouteViews[];
  totalViews: number;
}) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-0.5 px-5 py-4">
        <h2 className="text-title font-medium">Views by route</h2>
        <p className="text-sm text-muted-foreground">
          Share of page views, {rangeHints[range]}
        </p>
      </div>
      <div className="flex flex-col items-center gap-8 border-t border-border p-6 md:flex-row">
        <div className="relative size-56 shrink-0">
          <ChartContainer
            config={chartConfig}
            className="aspect-square size-56"
          >
            <PieChart>
              <Pie
                data={routes}
                dataKey="views"
                nameKey="route"
                innerRadius={77}
                outerRadius={111}
                paddingAngle={routes.length > 1 ? 1 : 0}
                stroke="none"
                isAnimationActive={false}
              >
                {routes.map((route, index) => (
                  <Cell
                    key={route.route}
                    fill={ROUTE_COLORS[index % ROUTE_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm text-muted-foreground">Total views</span>
            <span className="text-stat font-medium tracking-tight">
              {formatNumber(totalViews)}
            </span>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead>Route</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Share</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((route, index) => (
              <TableRow key={route.route} className="border-0">
                <TableCell>
                  <span className="flex items-center gap-3">
                    <span
                      className="size-2.5 shrink-0 rounded-sm"
                      style={{
                        backgroundColor:
                          ROUTE_COLORS[index % ROUTE_COLORS.length],
                      }}
                    />
                    <span
                      className={cn(
                        "truncate",
                        isRoute(route.route)
                          ? "font-mono text-[15px]"
                          : "text-muted-foreground",
                      )}
                    >
                      {route.route}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(route.views)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {formatPercent(route.percentage)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export { RoutesCard };
