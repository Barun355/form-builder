import { cn } from "~/lib/utils";

export type FormStatus = "draft" | "published" | "archived" | "closed";

const variants: Record<FormStatus, { wrapper: string; dot: string }> = {
  draft: {
    wrapper: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
  published: {
    wrapper: "bg-success/15 text-success border-success/30",
    dot: "bg-success",
  },
  archived: {
    wrapper: "bg-warning/15 text-warning border-warning/30",
    dot: "bg-warning",
  },
  closed: {
    wrapper: "bg-destructive/15 text-destructive border-destructive/30",
    dot: "bg-destructive",
  },
};

export function StatusChip({
  status,
  className,
}: {
  status: FormStatus;
  className?: string;
}) {
  const v = variants[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-caps uppercase",
        v.wrapper,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", v.dot)} />
      {status}
    </span>
  );
}
