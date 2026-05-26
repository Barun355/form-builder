"use client";

import * as React from "react";
import { IconTrendingUp, IconTrendingDown, IconMinus } from "@tabler/icons-react";

import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

type Props = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  /** Signed fraction (0.12 = +12%); null hides the badge. */
  deltaPct?: number | null;
  /** Tooltip-style suffix on the delta ("vs last month") */
  deltaSuffix?: string;
  /** Subtitle rendered below the value (used for "Avg X" type extras) */
  subValue?: string;
  isLoading?: boolean;
};

function formatDelta(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  const formatted =
    Math.abs(pct) >= 1
      ? `${(pct * 100).toFixed(0)}%`
      : `${(pct * 100).toFixed(1)}%`;
  return `${sign}${formatted}`;
}

export function StatCard({
  label,
  value,
  icon,
  deltaPct,
  deltaSuffix,
  subValue,
  isLoading,
}: Props) {
  const direction = deltaPct == null ? null : deltaPct > 0 ? "up" : deltaPct < 0 ? "down" : "flat";

  return (
    <div className="rounded-2xl border bg-card p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-caps uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </p>
          {isLoading ? (
            <Skeleton className="mt-3 h-8 w-20" />
          ) : (
            <p className="mt-2 text-h1 font-display text-foreground tabular-nums">
              {value}
            </p>
          )}
        </div>
        {icon ? (
          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {icon}
          </div>
        ) : null}
      </div>

      {!isLoading && deltaPct != null ? (
        <div
          className={cn(
            "mt-4 flex items-center gap-1 text-body-sm",
            direction === "up" && "text-success",
            direction === "down" && "text-destructive",
            direction === "flat" && "text-muted-foreground",
          )}
        >
          {direction === "up" ? (
            <IconTrendingUp className="size-3.5" />
          ) : direction === "down" ? (
            <IconTrendingDown className="size-3.5" />
          ) : (
            <IconMinus className="size-3.5" />
          )}
          <span className="font-medium">{formatDelta(deltaPct)}</span>
          {deltaSuffix ? (
            <span className="text-muted-foreground">{deltaSuffix}</span>
          ) : null}
        </div>
      ) : isLoading ? (
        <Skeleton className="mt-4 h-4 w-32" />
      ) : subValue ? (
        <div className="mt-4 h-4 text-body-sm text-muted-foreground tabular-nums">
          {subValue}
        </div>
      ) : (
        <div className="mt-4 h-4 text-body-sm text-muted-foreground">
          No baseline yet
        </div>
      )}
    </div>
  );
}
