"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";
import type { BuilderState } from "./store";

type Props = {
  state: BuilderState;
};

export function SaveIndicator({ state }: Props) {
  const { isSaving, isDirty, lastSavedAt, saveError } = state;
  const [, force] = React.useReducer((n: number) => n + 1, 0);

  // Re-render every 30s so the relative-time text refreshes.
  React.useEffect(() => {
    if (!lastSavedAt) return;
    const interval = setInterval(force, 30_000);
    return () => clearInterval(interval);
  }, [lastSavedAt]);

  if (isSaving) {
    return (
      <span className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Saving...
      </span>
    );
  }

  if (saveError) {
    return (
      <span className="inline-flex items-center gap-1.5 text-body-sm text-destructive">
        Save failed — try again
      </span>
    );
  }

  if (isDirty) {
    return (
      <span className="inline-flex items-center gap-1.5 text-body-sm text-warning">
        Unsaved changes
      </span>
    );
  }

  if (lastSavedAt) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-body-sm text-muted-foreground")}>
        Saved {relativeTime(lastSavedAt)}
      </span>
    );
  }

  return null;
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
