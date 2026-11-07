import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartColumn, Table2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AnalyticsRange } from "@/features/analytics/api";
import {
  peakBucketIndex,
  rangeHints,
  type ViewsBucket,
} from "@/features/analytics/buckets";
import { formatNumber } from "@/lib/format";

const chartConfig = {
  views: { label: "Views", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

type ChartMode = "chart" | "table";

function ViewsTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: ViewsBucket }[];
}) {
  const bucket = payload?.[0]?.payload;

  if (!active || !bucket) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border-strong bg-muted px-3 py-2 text-label shadow-xl shadow-black">
      <span className="text-muted-foreground">{bucket.rangeLabel}</span>
      <span className="flex items-center gap-2 font-medium">
        <span className="size-2 rounded-xs bg-chart-1" />
        {formatNumber(bucket.views)} views
      </span>
    </div>
  );
}

function ViewsChartCard({
  range,
  buckets,
  totalViews,
}: {
  range: AnalyticsRange;
  buckets: ViewsBucket[];
  totalViews: number;
}) {
  const [mode, setMode] = useState<ChartMode>("chart");
  const peakIndex = peakBucketIndex(buckets);
  const unit = range === "24h" ? "hour" : "day";

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-title font-medium">Page views</h2>
          <p className="text-sm text-muted-foreground">
            Per {unit}, {rangeHints[range]}
          </p>
        </div>
        <ToggleGroup
          value={[mode]}
          onValueChange={(next) => {
            const selected = next[0];
            if (selected === "chart" || selected === "table") {
              setMode(selected);
            }
          }}
          spacing={0}
          className="rounded-md border border-border-strong bg-card p-0.5"
          aria-label="Display mode"
        >
          <ToggleGroupItem value="chart" size="sm" className="gap-1.5 px-3">
            <ChartColumn />
            Chart
          </ToggleGroupItem>
          <ToggleGroupItem value="table" size="sm" className="gap-1.5 px-3">
            <Table2 />
            Table
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="border-t border-border px-5 pt-6 pb-4">
        {mode === "chart" ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-72 w-full"
          >
            <BarChart data={buckets} margin={{ left: 0, right: 0, top: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: "var(--color-border-strong)" }}
                tickMargin={10}
                minTickGap={24}
              />
              <YAxis
                width={40}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickFormatter={(value: number) => formatNumber(value)}
              />
              <ChartTooltip
                cursor={{ fill: "var(--color-accent)", opacity: 0.4 }}
                content={<ViewsTooltip />}
              />
              <Bar dataKey="views" radius={[3, 3, 0, 0]}>
                {buckets.map((bucket, index) => (
                  <Cell
                    key={bucket.key}
                    fill={
                      index === peakIndex
                        ? "var(--color-chart-1)"
                        : "var(--color-chart-muted)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{range === "24h" ? "Hour" : "Day"}</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buckets.map((bucket) => (
                  <TableRow key={bucket.key}>
                    <TableCell>{bucket.rangeLabel}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(bucket.views)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {totalViews === 0
                        ? "0.0%"
                        : `${((bucket.views / totalViews) * 100).toFixed(1)}%`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Card>
  );
}

export { ViewsChartCard };
