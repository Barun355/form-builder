"use client";

import { useRouter } from "next/navigation";
import { IconChartBar } from "@tabler/icons-react";

import { Skeleton } from "~/components/ui/skeleton";
import { StatusChip, type FormStatus } from "~/components/status-chip";
import { useGlobalAnalyticsTopForms } from "~/hooks/analytics";

export function TopFormsCard() {
  const router = useRouter();
  const { data, isLoading } = useGlobalAnalyticsTopForms(10);
  const items = data ?? [];
  const max = items.reduce((m, i) => Math.max(m, i.submissionCount), 0);

  return (
    <div className="rounded-2xl border bg-card p-5">
      <h3 className="text-h4 text-foreground">Top forms by submissions</h3>
      <p className="text-body-sm text-muted-foreground mt-0.5">
        Click any row to drill into per-form analytics.
      </p>

      <div className="mt-5 space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center text-center text-muted-foreground py-8">
            <IconChartBar
              className="size-8 mb-2 opacity-40"
              strokeWidth={1.5}
            />
            <p className="text-body-sm">No data yet</p>
          </div>
        ) : (
          items.map((form) => {
            const widthPct =
              max === 0 ? 0 : Math.max(4, (form.submissionCount / max) * 100);
            return (
              <button
                key={form.id}
                onClick={() =>
                  router.push(`/dashboard/forms/${form.id}/analytics`)
                }
                className="group block w-full text-left rounded-md hover:bg-muted/40 transition-colors p-2 -mx-2"
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-body text-foreground font-medium truncate">
                      {form.title}
                    </span>
                    <StatusChip status={form.status as FormStatus} />
                  </div>
                  <span className="text-body-sm text-muted-foreground tabular-nums shrink-0">
                    {form.submissionCount.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
