"use client";

import * as React from "react";
import { HexColorPicker } from "react-colorful";
import { contrastRatio } from "@repo/theme";

import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

type Props = {
  /** Current hex value (`#rrggbb`). */
  value: string;
  /** Called with the new hex on every change. Lowercase, `#` prefixed. */
  onChange: (hex: string) => void;
  /**
   * Optional companion color to grade legibility against. When set, the
   * picker shows a WCAG contrast ratio + AA/AAA badge underneath the
   * swatch — the gentle nudge described in the analysis doc.
   */
  pairColor?: string;
  /** Label for the contrast pair (e.g. "vs Text", "vs Background"). */
  pairLabel?: string;
  /**
   * When the pair is normal body text, threshold is 4.5; when it's large
   * text / chrome (button labels, etc.), 3 is enough. Defaults to 4.5.
   */
  pairThreshold?: number;
  disabled?: boolean;
  /** Optional ARIA label for the trigger button. */
  ariaLabel?: string;
};

/**
 * Hex color picker used across every Colors / Inputs / Buttons row in the
 * theme editor. Click the swatch to open a popover with the 2D area + hue
 * slider, an editable hex input, and (when `pairColor` is set) a live
 * contrast indicator.
 *
 * Alpha and saved-swatches are explicitly deferred to keep the v1 surface
 * small; both can drop in without changing the public API.
 */
export function ColorPicker({
  value,
  onChange,
  pairColor,
  pairLabel,
  pairThreshold = 4.5,
  disabled,
  ariaLabel,
}: Props) {
  // Locally-controlled hex input — we only push back to `onChange` when
  // the user types a complete `#rrggbb`. Until then they can be partway
  // through editing without us spamming the parent with intermediate
  // invalid values.
  const [hexDraft, setHexDraft] = React.useState(value);
  React.useEffect(() => {
    setHexDraft(value);
  }, [value]);

  function handleHexChange(next: string) {
    setHexDraft(next);
    if (/^#[0-9a-fA-F]{6}$/.test(next)) {
      onChange(next.toLowerCase());
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel ?? "Open color picker"}
          className={cn(
            "size-7 shrink-0 rounded border border-border shadow-sm transition-shadow",
            "hover:shadow disabled:opacity-40 disabled:cursor-not-allowed",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          )}
          style={{ background: value }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start" sideOffset={6}>
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-md">
            <HexColorPicker
              color={value}
              onChange={(c) => onChange(c.toLowerCase())}
              style={{ width: "100%", height: 160 }}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-body-sm text-muted-foreground" htmlFor="picker-hex">
              Hex
            </label>
            <Input
              id="picker-hex"
              value={hexDraft}
              onChange={(e) => handleHexChange(e.target.value)}
              onBlur={() => setHexDraft(value)}
              maxLength={7}
              className="h-8 font-mono text-body-sm"
              spellCheck={false}
            />
          </div>

          {pairColor ? (
            <ContrastIndicator
              foreground={value}
              background={pairColor}
              label={pairLabel}
              threshold={pairThreshold}
            />
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * WCAG 2.1 contrast indicator. Shows the ratio + an AA / AAA passage chip.
 * Soft: a fail is never blocked — the editor lets the user save anyway.
 */
function ContrastIndicator({
  foreground,
  background,
  label,
  threshold,
}: {
  foreground: string;
  background: string;
  label?: string;
  threshold: number;
}) {
  const ratio = React.useMemo(
    () => contrastRatio(foreground, background),
    [foreground, background],
  );
  const passesAA = ratio >= threshold;
  const passesAAA = ratio >= (threshold === 3 ? 4.5 : 7);

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-2">
      <div className="flex flex-col">
        <span className="text-caps uppercase text-muted-foreground">
          {label ?? "Contrast"}
        </span>
        <span className="font-mono text-body-sm text-foreground">
          {ratio.toFixed(2)} : 1
        </span>
      </div>
      <div className="flex items-center gap-1">
        <PassageChip label="AA" passes={passesAA} />
        <PassageChip label="AAA" passes={passesAAA} />
      </div>
    </div>
  );
}

function PassageChip({ label, passes }: { label: string; passes: boolean }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        passes
          ? "bg-success/15 text-success"
          : "bg-destructive/15 text-destructive",
      )}
      title={`${label} ${passes ? "passes" : "fails"}`}
    >
      {label}
    </span>
  );
}
