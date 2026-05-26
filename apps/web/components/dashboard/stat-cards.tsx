"use client";

import {
  IconCalendarWeek,
  IconChartLine,
  IconClipboardText,
  IconInbox,
} from "@tabler/icons-react";

import { StatCard } from "./stat-card";
import { useDashboardStats } from "~/hooks/dashboard";

export function StatCards() {
  const { data, isLoading } = useDashboardStats();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total forms"
        value={data?.totalForms?.toLocaleString() ?? "—"}
        icon={<IconClipboardText className="size-5" />}
        deltaPct={data?.totalFormsDeltaPct ?? null}
        deltaSuffix="vs last month"
        isLoading={isLoading}
      />
      <StatCard
        label="Total submissions"
        value={data?.totalSubmissions?.toLocaleString() ?? "—"}
        icon={<IconInbox className="size-5" />}
        deltaPct={data?.totalSubmissionsDeltaPct ?? null}
        deltaSuffix="vs last month"
        isLoading={isLoading}
      />
      <StatCard
        label="Completion rate"
        value={
          data != null ? `${(data.completionRate * 100).toFixed(0)}%` : "—"
        }
        icon={<IconChartLine className="size-5" />}
        deltaPct={data?.completionRateDeltaPct ?? null}
        deltaSuffix="vs last month"
        isLoading={isLoading}
      />
      <StatCard
        label="This week"
        value={data?.weeklySubmissions?.toLocaleString() ?? "—"}
        icon={<IconCalendarWeek className="size-5" />}
        deltaPct={data?.weeklySubmissionsDeltaPct ?? null}
        deltaSuffix="vs last week"
        isLoading={isLoading}
      />
    </div>
  );
}
