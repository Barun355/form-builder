import { cn } from "~/lib/utils";

export function MiniFunnel({ className }: { className?: string }) {
  const started = 1280;
  const reached = 1140;
  const completed = 980;
  const pct = Math.round((completed / started) * 100);
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 space-y-3",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-body-sm text-muted-foreground">
          Funnel · last 7d
        </span>
        <span className="text-body-sm text-success font-medium tabular-nums">
          {pct}%
        </span>
      </div>
      <Bar label="Started" value={started} max={started} tone="muted" />
      <Bar label="Reached page 2" value={reached} max={started} tone="info" />
      <Bar label="Completed" value={completed} max={started} tone="primary" />
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "muted" | "info" | "primary";
}) {
  const pct = Math.round((value / max) * 100);
  const fill =
    tone === "primary"
      ? "bg-primary"
      : tone === "info"
        ? "bg-info"
        : "bg-muted-foreground/40";
  return (
    <div>
      <div className="flex items-center justify-between text-body-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {value.toLocaleString()}
        </span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
