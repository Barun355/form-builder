"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "~/components/ui/skeleton";
import type { AudienceBucket } from "./audience-card";

type Props = {
  hasUtmData?: boolean;
  utmSource: AudienceBucket[];
  utmMedium: AudienceBucket[];
  utmCampaign: AudienceBucket[];
  isLoading?: boolean;
};

export function UtmSources({
  hasUtmData,
  utmSource,
  utmMedium,
  utmCampaign,
  isLoading,
}: Props) {
  if (!isLoading && !hasUtmData) return null;

  return (
    <div className="rounded-2xl border bg-card p-5">
      <h3 className="text-h4 text-foreground">Traffic sources (UTM)</h3>
      <p className="text-body-sm text-muted-foreground mt-0.5">
        Top tagged sources for completed submissions.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-3">
        <UtmBlock title="Source" data={utmSource} isLoading={isLoading} />
        <UtmBlock title="Medium" data={utmMedium} isLoading={isLoading} />
        <UtmBlock title="Campaign" data={utmCampaign} isLoading={isLoading} />
      </div>
    </div>
  );
}

function UtmBlock({
  title,
  data,
  isLoading,
}: {
  title: string;
  data: AudienceBucket[];
  isLoading?: boolean;
}) {
  return (
    <div>
      <p className="text-caps uppercase text-muted-foreground mb-2">{title}</p>
      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-md" />
      ) : data.length === 0 ? (
        <p className="text-body-sm text-muted-foreground py-6">No data</p>
      ) : (
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 0, left: -8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke="var(--color-muted-foreground)"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                allowDecimals={false}
              />
              <YAxis
                dataKey="value"
                type="category"
                stroke="var(--color-muted-foreground)"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                width={64}
              />
              <Tooltip
                cursor={{ fill: "var(--color-muted)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0];
                  if (!p) return null;
                  return (
                    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-body-sm">
                      <p className="text-foreground font-medium">
                        {p.payload?.value || "Unknown"}
                      </p>
                      <p className="text-muted-foreground tabular-nums">
                        {(p.value as number).toLocaleString()}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="count"
                fill="var(--color-chart-2)"
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
