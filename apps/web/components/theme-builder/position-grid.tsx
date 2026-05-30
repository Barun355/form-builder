"use client";

import { cn } from "~/lib/utils";

export type ImagePosition =
  | "top-left" | "top" | "top-right"
  | "left" | "center" | "right"
  | "bottom-left" | "bottom" | "bottom-right";

const CELLS: { value: ImagePosition; label: string }[] = [
  { value: "top-left", label: "Top left" },
  { value: "top", label: "Top" },
  { value: "top-right", label: "Top right" },
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom", label: "Bottom" },
  { value: "bottom-right", label: "Bottom right" },
];

/**
 * 3×3 picker for image background position. Compact — each cell is a
 * radio button; the active cell shows a filled dot. Used by the Image
 * branch of the Background section.
 */
export function PositionGrid({
  value,
  onChange,
  disabled,
}: {
  value: ImagePosition;
  onChange: (next: ImagePosition) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Image position"
      className="inline-grid grid-cols-3 gap-1 rounded-md border border-border bg-background p-1"
    >
      {CELLS.map(({ value: cell, label }) => {
        const active = cell === value;
        return (
          <button
            key={cell}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(cell)}
            className={cn(
              "flex size-7 items-center justify-center rounded transition-colors",
              active
                ? "bg-accent"
                : "hover:bg-muted/60 disabled:hover:bg-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <span
              className={cn(
                "block size-1.5 rounded-full transition-colors",
                active ? "bg-foreground" : "bg-muted-foreground/60",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
