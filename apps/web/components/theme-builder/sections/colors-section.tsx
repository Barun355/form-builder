"use client";

import * as React from "react";
import { IconTrash } from "@tabler/icons-react";
import type { ColorTokens } from "@repo/theme";

import { Button } from "~/components/ui/button";
import { useThemeBuilderStore } from "../store";
import { ColorPicker } from "../color-picker";
import { AddDarkVariantCTA } from "../add-dark-variant-cta";

type ColorKey = keyof ColorTokens;

interface RowDef {
  key: ColorKey;
  label: string;
  description?: string;
  /**
   * If set, the contrast indicator inside the picker grades this color
   * against the named pair color (read from `tokens.colors`). Skipped on
   * decorative tokens like `accent` and `border`.
   */
  pair?: ColorKey;
  /** Pair label shown in the indicator. */
  pairLabel?: string;
  /**
   * WCAG threshold to use for the AA chip. 4.5 = body text; 3 = large
   * text and UI chrome where slightly lower contrast is acceptable.
   * Defaults to 4.5 when omitted.
   */
  pairThreshold?: number;
}

// "Background" semantic color (`palette.colors.background`) is intentionally
// NOT a row here. The page background is owned by the Background section
// (the `palette.background` discriminated union — solid/gradient/image),
// which is the actual consumer of `--sf-page-bg`. The semantic color stays
// in the schema as a no-op placeholder; surfacing it in the editor would
// be misleading because nothing reads it.
const ROWS: readonly RowDef[] = [
  {
    key: "surface",
    label: "Surface",
    description: "Form card color (sits on top of the background).",
    pair: "foreground",
    pairLabel: "vs Text",
  },
  {
    key: "foreground",
    label: "Text",
    description: "Body text and headings inside the card.",
    pair: "surface",
    pairLabel: "vs Surface",
  },
  {
    key: "mutedForeground",
    label: "Muted text",
    description: "Help text, placeholders, secondary labels.",
    pair: "surface",
    pairLabel: "vs Surface",
    pairThreshold: 3,
  },
  {
    key: "primary",
    label: "Primary",
    description: "Buttons, focus rings, highlights.",
    pair: "primaryForeground",
    pairLabel: "vs On-primary",
    pairThreshold: 3,
  },
  {
    key: "primaryForeground",
    label: "On-primary",
    description: "Text on primary buttons.",
    pair: "primary",
    pairLabel: "vs Primary",
  },
  {
    key: "accent",
    label: "Accent",
    description: "Hover backgrounds, subtle accents.",
  },
  {
    key: "border",
    label: "Border",
    description: "Field borders, dividers.",
  },
  {
    key: "error",
    label: "Error",
    description:
      "Required-field markers and validation/error message text.",
    pair: "surface",
    pairLabel: "vs Surface",
    pairThreshold: 3,
  },
  // "Success" semantic color (`palette.colors.success`) is intentionally
  // NOT a row here. No element inside the form is themed for success
  // state today (the ThankYouScreen lives OUTSIDE `data-sf-root` and uses
  // app-level styling). The value stays in the schema as a no-op
  // placeholder; surfacing it in the editor would be misleading because
  // nothing reads it.
] as const;

/**
 * Ten rows — one per semantic color token. Each row pairs a swatch-and-
 * hex display with a `<ColorPicker>` popover. Pair-based contrast hints
 * live inside the picker so they only surface while the user is editing
 * that color (no constant noise in the panel).
 *
 * Variant-aware: reads/writes through `palette[editingMode]` so the topbar
 * Light/Dark toggle swaps which palette these rows edit. Switching to Dark
 * when no dark variant exists yet surfaces the "Add dark variant" CTA
 * instead of the rows — the rows mount once the variant is cloned.
 */
export function ColorsSection() {
  const editingMode = useThemeBuilderStore((s) => s.editingMode);
  const palette = useThemeBuilderStore((s) => s.tokens.palette);
  const setTokens = useThemeBuilderStore((s) => s.setTokens);
  const isOwner = useThemeBuilderStore((s) => s.isOwner);
  const addDarkVariant = useThemeBuilderStore((s) => s.addDarkVariant);
  const removeDarkVariant = useThemeBuilderStore((s) => s.removeDarkVariant);

  const activePalette = palette[editingMode];

  function setColor(key: ColorKey, hex: string) {
    setTokens((prev) => {
      const current = prev.palette[editingMode];
      // Should never trip — the rows don't render when the active palette
      // is missing — but guard anyway so a stray race can't crash the
      // editor.
      if (!current) return prev;
      return {
        ...prev,
        palette: {
          ...prev.palette,
          [editingMode]: {
            ...current,
            colors: { ...current.colors, [key]: hex },
          },
        },
      };
    });
  }

  if (editingMode === "dark" && !activePalette) {
    return (
      <AddDarkVariantCTA
        onAdd={addDarkVariant}
        disabled={!isOwner}
      />
    );
  }

  const colors = activePalette!.colors;

  return (
    <div className="flex flex-col gap-2">
      {ROWS.map((row) => (
        <ColorRow
          key={row.key}
          def={row}
          value={colors[row.key]}
          pairValue={row.pair ? colors[row.pair] : undefined}
          onChange={(hex) => setColor(row.key, hex)}
          disabled={!isOwner}
        />
      ))}
      <p className="mt-2 text-body-sm text-muted-foreground">
        Contrast hints in the picker grade legibility against the paired
        color. They&apos;re a nudge, not a block — publish with whatever
        ratio you like.
      </p>

      {/* Remove-dark affordance only when editing the dark palette. Light
          is the always-present baseline; the user can't drop it. */}
      {editingMode === "dark" && isOwner ? (
        <div className="mt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={removeDarkVariant}
            className="text-muted-foreground hover:text-destructive"
          >
            <IconTrash className="size-4" />
            Remove dark variant
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ColorRow({
  def,
  value,
  pairValue,
  onChange,
  disabled,
}: {
  def: RowDef;
  value: string;
  pairValue: string | undefined;
  onChange: (hex: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40">
      <ColorPicker
        value={value}
        onChange={onChange}
        pairColor={pairValue}
        pairLabel={def.pairLabel}
        pairThreshold={def.pairThreshold}
        disabled={disabled}
        ariaLabel={`Pick ${def.label.toLowerCase()} color`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-foreground">
          {def.label}
        </p>
        {def.description ? (
          <p className="truncate text-body-sm text-muted-foreground">
            {def.description}
          </p>
        ) : null}
      </div>
      <span className="shrink-0 font-mono text-body-sm text-muted-foreground">
        {value}
      </span>
    </div>
  );
}
