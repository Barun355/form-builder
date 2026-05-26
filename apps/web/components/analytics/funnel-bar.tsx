"use client";

import { cn } from "~/lib/utils";

type Props = {
  starts: number;
  completed: number;
};

export function FunnelBar({ starts, completed }: Props) {
  const completionRate = starts === 0 ? 0 : completed / starts;
  const completedWidthPct =
    starts === 0 ? 0 : Math.max(2, Math.round((completed / starts) * 100));

  return (
    <div className="rounded-2xl border bg-card p-5">
      <h3 className="text-h4 text-foreground">Funnel</h3>
      <p className="text-body-sm text-muted-foreground mt-0.5">
        Of {starts.toLocaleString()} started, {completed.toLocaleString()}{" "}
        completed ({(completionRate * 100).toFixed(0)}%).
      </p>

      <div className="mt-5 space-y-3">
        <FunnelRow
          label="Started"
          value={starts}
          widthPct={100}
          tone="primary"
        />
        <FunnelRow
          label="Completed"
          value={completed}
          widthPct={completedWidthPct}
          tone="success"
        />
      </div>
    </div>
  );
}

function FunnelRow({
  label,
  value,
  widthPct,
  tone,
}: {
  label: string;
  value: number;
  widthPct: number;
  tone: "primary" | "success";
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-body-sm mb-1">
        <span className="text-foreground font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {value.toLocaleString()}
        </span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            tone === "primary" && "bg-primary",
            tone === "success" && "bg-success",
          )}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}
