import { cn } from "~/lib/utils";
import type { FormStatus } from "./status-chip";

/**
 * Renders the form's "current version" label:
 *  - published / archived / closed → "v{publishedVersionNumber} {status}"
 *  - draft                          → "v{currentVersionNumber} draft"
 */
export function VersionBadge({
  status,
  publishedVersionNumber,
  currentVersionNumber,
  className,
}: {
  status: FormStatus;
  publishedVersionNumber: number | null;
  currentVersionNumber: number;
  className?: string;
}) {
  const displayVersion =
    status === "draft" ? currentVersionNumber : publishedVersionNumber;
  const label = status === "draft" ? "draft" : status;

  if (displayVersion == null) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-body-sm font-medium tabular-nums",
        className,
      )}
    >
      <span className="text-foreground">v{displayVersion}</span>
      <span className="text-muted-foreground text-caps uppercase">{label}</span>
    </span>
  );
}
