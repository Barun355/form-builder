"use client";

import { IconMoon } from "@tabler/icons-react";

import { Button } from "~/components/ui/button";

/**
 * Empty-state CTA shown by every palette-bearing editor section (Colors,
 * Buttons palette, Inputs palette, Background) when the user toggles to
 * Dark on a theme that doesn't have a dark variant yet. Clicking the
 * action calls `onAdd` which clones `palette.light` into `palette.dark`
 * via the store's `addDarkVariant` action.
 *
 * Shared across sections so each one renders the same affordance — and so
 * we only have one place to evolve the copy or visual treatment.
 */
export function AddDarkVariantCTA({
  onAdd,
  disabled,
}: {
  onAdd: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border bg-muted/30 px-4 py-5">
      <div className="flex items-center gap-2 text-foreground">
        <IconMoon className="size-4 text-muted-foreground" />
        <p className="text-body font-medium">No dark variant yet</p>
      </div>
      <p className="text-body-sm text-muted-foreground">
        Add a dark palette to give viewers in dark mode a separate color
        set. We&apos;ll clone the current light palette as a starting
        point so you only have to tune what changes.
      </p>
      <Button size="sm" onClick={onAdd} disabled={disabled}>
        Add dark variant
      </Button>
    </div>
  );
}
