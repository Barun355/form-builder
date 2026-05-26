import { cn } from "~/lib/utils";

const OPTIONS = [
  { label: "Very satisfied", selected: true },
  { label: "Satisfied", selected: false },
  { label: "Neutral", selected: false },
];

export function MiniFormRenderer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-lg overflow-hidden",
        className,
      )}
    >
      <div className="px-6 pt-6">
        <span className="text-caps uppercase text-muted-foreground tracking-wider text-xs">
          Question 2 of 5
        </span>
        <h4 className="mt-2 text-h3 text-foreground">
          How was your trial experience?
        </h4>
      </div>
      <div className="px-6 mt-4 space-y-2">
        {OPTIONS.map((o) => (
          <button
            key={o.label}
            disabled
            className={cn(
              "w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-body-sm transition-colors",
              o.selected
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            <span
              className={cn(
                "size-4 rounded-full border-2 flex items-center justify-center shrink-0",
                o.selected ? "border-primary" : "border-border",
              )}
            >
              {o.selected && (
                <span className="size-1.5 rounded-full bg-primary" />
              )}
            </span>
            <span className="truncate">{o.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-5 px-6 pb-6 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground">
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono">
            ↵
          </kbd>
          Press to continue
        </span>
        <button
          disabled
          className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-body-sm font-medium shadow-sm"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
