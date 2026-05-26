"use client";

import {
  IconCheck,
  IconChartLine,
  IconClock,
  IconInbox,
} from "@tabler/icons-react";

import { StatCard } from "~/components/dashboard/stat-card";
import { useFormAnalyticsKpis } from "~/hooks/analytics";

function formatSeconds(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m < 60) return s === 0 ? `${m}m` : `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return `${h}h ${remM}m`;
}

type Props = {
  formId: string;
};

export function PerFormKpis({ formId }: Props) {
  const { data, isLoading } = useFormAnalyticsKpis(formId);

  const meanLabel =
    data?.meanTimeToCompleteSeconds != null
      ? `Avg ${formatSeconds(data.meanTimeToCompleteSeconds)}`
      : undefined;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Starts"
        value={data?.totalStarts?.toLocaleString() ?? "—"}
        icon={<IconInbox className="size-5" />}
        isLoading={isLoading}
      />
      <StatCard
        label="Completed"
        value={data?.totalCompleted?.toLocaleString() ?? "—"}
        icon={<IconCheck className="size-5" />}
        isLoading={isLoading}
      />
      <StatCard
        label="Completion rate"
        value={data ? `${(data.completionRate * 100).toFixed(0)}%` : "—"}
        icon={<IconChartLine className="size-5" />}
        isLoading={isLoading}
      />
      <StatCard
        label="Median time"
        value={formatSeconds(data?.medianTimeToCompleteSeconds ?? null)}
        icon={<IconClock className="size-5" />}
        subValue={meanLabel}
        isLoading={isLoading}
      />
    </div>
  );
}
