import { cn } from "~/lib/utils";

export function PillBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur-sm px-3 py-1 text-body-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
