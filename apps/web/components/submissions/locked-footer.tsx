"use client";

import Link from "next/link";
import { IconLock } from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import { useDashboardStats } from "~/hooks/dashboard";

/**
 * Renders below the submissions table when the Free user has more
 * submissions this month than their plan allows them to see. The exact
 * locked count comes from the dashboard.stats endpoint (workspace-wide,
 * not per-form), since the cap is per-user not per-form. Older
 * submissions are stored — the message reassures, doesn't alarm.
 */
export function LockedSubmissionsFooter() {
  const { data } = useDashboardStats();
  if (!data) return null;
  if (data.plan !== "free") return null;
  if (data.monthlyLockedCount <= 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/40 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-start gap-3">
        <IconLock className="size-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-body-sm text-foreground font-medium">
            + {data.monthlyLockedCount.toLocaleString()} more this month hidden behind your plan
          </p>
          <p className="text-body-sm text-muted-foreground mt-0.5">
            Older submissions are stored safely. Upgrade to view all of them.
          </p>
        </div>
      </div>
      <Button asChild size="sm" variant="outline" className="shrink-0">
        <Link href="/#pricing">Upgrade →</Link>
      </Button>
    </div>
  );
}
