import { cn } from "~/lib/utils";

const ROWS = [
  { initials: "MR", name: "Maya R.", role: "Product feedback", time: "just now", color: "bg-primary/15 text-primary" },
  { initials: "JL", name: "Jordan L.", role: "Bug report", time: "2m ago", color: "bg-info/15 text-info" },
  { initials: "AS", name: "Anu S.", role: "Newsletter", time: "5m ago", color: "bg-success/15 text-success" },
];

export function MiniSubmissionsList({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-body-sm font-medium text-foreground">
          Recent submissions
        </span>
        <span className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          Live
        </span>
      </div>
      <div className="divide-y divide-border">
        {ROWS.map((r) => (
          <div key={r.name} className="flex items-center gap-3 px-4 py-3">
            <div
              className={cn(
                "size-8 rounded-full flex items-center justify-center text-body-sm font-medium tabular-nums",
                r.color,
              )}
            >
              {r.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm text-foreground truncate">{r.name}</p>
              <p className="text-body-sm text-muted-foreground truncate">
                {r.role}
              </p>
            </div>
            <span className="text-body-sm text-muted-foreground tabular-nums">
              {r.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
