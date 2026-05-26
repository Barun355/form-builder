"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconChartArea } from "@tabler/icons-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { useSubmissionTrend } from "~/hooks/dashboard";

type Range = 7 | 30 | 90;
const RANGES: { label: string; value: Range }[] = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

function parseRange(raw: string | null): Range {
  if (raw === "7d") return 7;
  if (raw === "90d") return 90;
  return 30;
}

function formatRange(value: Range): string {
  return `${value}d`;
}

const tickDateFmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

const tooltipDateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export function SubmissionTrendChart() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const range = parseRange(searchParams?.get("range") ?? null);
  const { data, isLoading } = useSubmissionTrend(range);

  function setRange(next: Range) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next === 30) params.delete("range");
    else params.set("range", formatRange(next));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : (pathname ?? "/"));
  }

  const chartData = React.useMemo(
    () =>
      (data ?? []).map((d) => ({
        date: d.date,
        count: d.count,
      })),
    [data],
  );

  const totalInRange = React.useMemo(
    () => chartData.reduce((sum, d) => sum + d.count, 0),
    [chartData],
  );

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-h4 text-foreground">Submission trend</h2>
          <p className="text-body-sm text-muted-foreground mt-0.5 tabular-nums">
            {isLoading
              ? "Loading..."
              : `${totalInRange.toLocaleString()} submission${totalInRange === 1 ? "" : "s"} in the last ${range} days`}
          </p>
        </div>
        <div className="inline-flex rounded-md border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={cn(
                "px-3 py-1 text-body-sm font-medium rounded transition-colors",
                range === r.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 h-64">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-md" />
        ) : totalInRange === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
            >
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-chart-1)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-chart-1)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="var(--color-muted-foreground)"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(d: string) =>
                  tickDateFmt.format(new Date(d))
                }
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
                width={36}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{
                  stroke: "var(--color-border)",
                  strokeDasharray: "3 3",
                }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0];
                  if (!p) return null;
                  const date = p.payload?.date as string;
                  const count = p.value as number;
                  return (
                    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
                      <p className="text-body-sm font-medium text-foreground">
                        {tooltipDateFmt.format(new Date(date))}
                      </p>
                      <p className="text-body-sm text-muted-foreground tabular-nums">
                        {count.toLocaleString()} submission
                        {count === 1 ? "" : "s"}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="url(#trendFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
      <IconChartArea
        className="size-10 mb-3 opacity-40"
        strokeWidth={1.5}
      />
      <p className="text-body-sm">No submissions in this period.</p>
    </div>
  );
}
