"use client";

import * as React from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Skeleton } from "~/components/ui/skeleton";

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-info)",
  "var(--color-warning)",
  "var(--color-muted-foreground)",
  "var(--color-success)",
];

export type AudienceBucket = { value: string; count: number };

type Props = {
  title: string;
  data: AudienceBucket[];
  isLoading?: boolean;
};

export function AudienceCard({ title, data, isLoading }: Props) {
  const total = React.useMemo(
    () => data.reduce((s, d) => s + d.count, 0),
    [data],
  );

  return (
    <div className="rounded-2xl border bg-card p-5">
      <h3 className="text-h4 text-foreground">{title}</h3>

      {isLoading ? (
        <Skeleton className="mt-4 h-44 w-full rounded-md" />
      ) : data.length === 0 ? (
        <p className="mt-6 text-body-sm text-muted-foreground text-center py-8">
          No data
        </p>
      ) : (
        <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center">
          <div className="h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="value"
                  innerRadius={42}
                  outerRadius={70}
                  strokeWidth={2}
                  stroke="var(--color-background)"
                  isAnimationActive={false}
                >
                  {data.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0];
                    if (!p) return null;
                    const value = p.payload?.value as string;
                    const count = p.value as number;
                    const pct = total === 0 ? 0 : (count / total) * 100;
                    return (
                      <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-body-sm">
                        <p className="text-foreground font-medium">{value}</p>
                        <p className="text-muted-foreground tabular-nums">
                          {count.toLocaleString()} ({pct.toFixed(0)}%)
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 min-w-0 space-y-1.5 w-full">
            {data.slice(0, 6).map((d, i) => {
              const pct = total === 0 ? 0 : (d.count / total) * 100;
              return (
                <div
                  key={d.value + i}
                  className="flex items-center gap-2 text-body-sm"
                >
                  <span
                    className="size-2.5 rounded-sm shrink-0"
                    style={{
                      backgroundColor:
                        CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                  <span className="text-foreground truncate flex-1 min-w-0">
                    {d.value || "Unknown"}
                  </span>
                  <span className="text-muted-foreground tabular-nums shrink-0">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
            {data.length > 6 ? (
              <p className="text-caps uppercase text-muted-foreground pt-1">
                +{data.length - 6} more
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
