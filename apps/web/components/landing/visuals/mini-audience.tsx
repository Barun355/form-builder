import { cn } from "~/lib/utils";

const SEGMENTS = [
  { label: "Desktop", pct: 60, color: "bg-chart-1" },
  { label: "Mobile", pct: 35, color: "bg-chart-2" },
  { label: "Tablet", pct: 5, color: "bg-chart-3" },
];

export function MiniAudience({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 space-y-3",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-body-sm text-muted-foreground">Device</span>
        <span className="text-body-sm text-foreground tabular-nums">1,531</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden">
        {SEGMENTS.map((s) => (
          <div
            key={s.label}
            className={s.color}
            style={{ width: `${s.pct}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {SEGMENTS.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-sm", s.color)} />
            <span className="text-body-sm text-muted-foreground">
              {s.label}
            </span>
            <span className="ml-auto text-body-sm text-foreground tabular-nums">
              {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
