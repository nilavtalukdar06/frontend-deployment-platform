import { ChartColumn, Table2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Section, Specimen } from "@/pages/theme/sections/section";
import { hourLabels, hourlyViews, routeShares } from "@/pages/theme/data";

const yAxisTicks = [600, 450, 300, 150, 0];
const chartMax = 612;
const peakIndex = hourlyViews.indexOf(Math.max(...hourlyViews));

function ChartTooltip() {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border-strong bg-muted px-3 py-2 text-label shadow-xl shadow-black">
      <span className="text-muted-foreground">Nov 6, 7:00 – 8:00 PM</span>
      <span className="flex items-center gap-2 font-medium">
        <span className="size-2 rounded-xs bg-chart-1" />
        612 views
      </span>
    </div>
  );
}

function BarChartCard() {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-start justify-between px-6 py-5">
        <div className="flex flex-col gap-0.5">
          <span className="text-title font-medium">Page views</span>
          <span className="text-sm text-muted-foreground">
            Per hour, last 24 hours
          </span>
        </div>
        <div className="inline-flex items-center rounded-md border border-border-strong bg-card p-0.5 text-label">
          <span className="flex h-7 items-center gap-1.5 rounded-sm bg-accent px-3 text-foreground">
            <ChartColumn className="size-3.5" />
            Chart
          </span>
          <span className="flex h-7 items-center gap-1.5 rounded-sm px-3 text-subtle">
            <Table2 className="size-3.5" />
            Table
          </span>
        </div>
      </div>
      <div className="relative border-t border-border px-6 pt-8 pb-4">
        <div className="flex gap-4">
          <div className="flex h-60 flex-col justify-between text-right text-label text-muted-foreground">
            {yAxisTicks.map((tick) => (
              <span key={tick} className="w-8 leading-none">
                {tick}
              </span>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div className="relative h-60">
              {yAxisTicks.map((tick) => (
                <span
                  key={tick}
                  className="absolute right-0 left-0 border-t border-border"
                  style={{ top: `${100 - (tick / chartMax) * 100}%` }}
                />
              ))}
              <div className="absolute inset-0 flex items-end gap-1.5">
                {hourlyViews.map((views, index) => (
                  <span
                    key={index}
                    className={`flex-1 rounded-t-[3px] ${index === peakIndex ? "bg-chart-1" : "bg-chart-muted"}`}
                    style={{ height: `${(views / chartMax) * 100}%` }}
                  />
                ))}
              </div>
              <span className="absolute right-0 bottom-0 left-0 border-t border-border-strong" />
              <div
                className="absolute z-10 hidden -translate-x-1/2 lg:block"
                style={{
                  left: `${((peakIndex + 0.5) / hourlyViews.length) * 100}%`,
                  bottom: "calc(100% - 4px)",
                }}
              >
                <ChartTooltip />
              </div>
            </div>
            <div className="flex gap-1.5 text-label text-muted-foreground">
              {hourLabels.map((label, index) => (
                <span key={index} className="relative h-4 flex-1">
                  {label && (
                    <span className="absolute left-0 whitespace-nowrap">
                      {label}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Donut() {
  const radius = 94;
  const circumference = 2 * Math.PI * radius;
  const gap = 3;
  let offset = 0;

  return (
    <div className="relative size-56 shrink-0">
      <svg viewBox="0 0 224 224" className="size-full -rotate-90">
        {routeShares.map((segment) => {
          const length = (segment.share / 100) * circumference;
          const circle = (
            <circle
              key={segment.route}
              cx="112"
              cy="112"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="34"
              strokeDasharray={`${Math.max(length - gap, 0)} ${circumference}`}
              strokeDashoffset={-offset}
            />
          );
          offset += length;
          return circle;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm text-muted-foreground">Total views</span>
        <span className="text-stat font-medium tracking-tight">8,214</span>
      </div>
    </div>
  );
}

function RoutesCard() {
  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-0.5 px-6 py-5">
        <span className="text-title font-medium">Views by route</span>
        <span className="text-sm text-muted-foreground">
          Share of page views, last 24 hours
        </span>
      </div>
      <div className="flex flex-col items-center gap-12 border-t border-border p-8 md:flex-row md:p-12">
        <Donut />
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="pb-4 text-left font-normal">Route</th>
              <th className="pb-4 text-right font-normal">Views</th>
              <th className="pb-4 text-right font-normal">Share</th>
            </tr>
          </thead>
          <tbody>
            {routeShares.map((row) => (
              <tr key={row.route}>
                <td className="py-3">
                  <span className="flex items-center gap-3">
                    <span
                      className="size-2.5 rounded-[3px]"
                      style={{ backgroundColor: row.color }}
                    />
                    <span
                      className={
                        row.route.startsWith("/")
                          ? "font-mono text-[15px]"
                          : "text-muted-foreground"
                      }
                    >
                      {row.route}
                    </span>
                  </span>
                </td>
                <td className="py-3 text-right tabular-nums">
                  {row.views.toLocaleString()}
                </td>
                <td className="py-3 text-right text-muted-foreground tabular-nums">
                  {row.share.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ChartsSection() {
  return (
    <Section
      id="charts"
      title="Charts"
      description="A single blue series with a highlighted peak bar, and a six-color categorical palette for the route share donut."
    >
      <Specimen label="Bar chart with tooltip">
        <BarChartCard />
      </Specimen>
      <Specimen label="Donut and legend table">
        <RoutesCard />
      </Specimen>
      <Specimen label="Tooltip">
        <div className="w-fit">
          <ChartTooltip />
        </div>
      </Specimen>
    </Section>
  );
}

export { ChartsSection };
