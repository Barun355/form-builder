import { TrendingUp } from "lucide-react";

export function MiniKpiCard({
  label = "Completion rate",
  value = "68%",
  delta = "+18%",
}: {
  label?: string;
  value?: string;
  delta?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-lg w-full max-w-56 min-w-48">
      <div className="flex items-center justify-between">
        <span className="text-body-sm text-muted-foreground">{label}</span>
        <span className="inline-flex items-center gap-1 text-body-sm text-success">
          <TrendingUp className="size-3.5" />
          {delta}
        </span>
      </div>
      <p className="mt-2 text-h2 text-foreground tabular-nums">{value}</p>
      <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full w-2/3 rounded-full bg-primary" />
      </div>
    </div>
  );
}
