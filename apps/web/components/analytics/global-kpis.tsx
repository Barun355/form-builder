"use client";

import {
  IconChartLine,
  IconClipboardText,
  IconInbox,
  IconRosetteDiscountCheck,
} from "@tabler/icons-react";

import { StatCard } from "~/components/dashboard/stat-card";
import { useGlobalAnalyticsKpis } from "~/hooks/analytics";

export function GlobalKpis() {
  const { data, isLoading } = useGlobalAnalyticsKpis();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total forms"
        value={data?.totalForms?.toLocaleString() ?? "—"}
        icon={<IconClipboardText className="size-5" />}
        isLoading={isLoading}
      />
      <StatCard
        label="Active forms"
        value={data?.activeForms?.toLocaleString() ?? "—"}
        icon={<IconRosetteDiscountCheck className="size-5" />}
        isLoading={isLoading}
      />
      <StatCard
        label="Total submissions"
        value={data?.totalSubmissionsAllTime?.toLocaleString() ?? "—"}
        icon={<IconInbox className="size-5" />}
        isLoading={isLoading}
      />
      <StatCard
        label="Avg completion rate"
        value={
          data != null ? `${(data.avgCompletionRate * 100).toFixed(0)}%` : "—"
        }
        icon={<IconChartLine className="size-5" />}
        isLoading={isLoading}
      />
    </div>
  );
}
