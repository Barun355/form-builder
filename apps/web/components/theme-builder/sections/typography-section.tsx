"use client";

import * as React from "react";
import type { TypeScale, AllowedFontValue } from "@repo/theme";

import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { useThemeBuilderStore } from "../store";
import { FontPicker } from "../font-picker";

const SCALE_OPTIONS: { value: TypeScale; label: string }[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

const WEIGHT_OPTIONS: { value: 400 | 500 | 600 | 700; label: string }[] = [
  { value: 400, label: "Regular" },
  { value: 500, label: "Medium" },
  { value: 600, label: "Semibold" },
  { value: 700, label: "Bold" },
];

// Letter spacing slider semantics — UI is integer steps from -10 to 10,
// each step = 0.005em. Stored as a float em value so the compiler can
// emit it verbatim without scaling.
//
// Range widened from the original -0.040 → 0 em (step 0.001 em) because
// 0.001 em is sub-pixel at body sizes, so each tick was invisible. New
// range -0.050 → 0.050 em with bigger steps makes every tick perceptible
// and lets users actually loosen letter spacing (not just tighten).
const LS_STEP_EM = 0.005;
const LS_MIN_STEPS = -10; // -0.050em
const LS_MAX_STEPS = 10; //   0.050em

/**
 * Typography section. Shared across modes — writes don't route through
 * `editingMode` because fonts/scale/weight/letter-spacing apply to both
 * light and dark viewers identically.
 *
 * Five controls: heading font, body font, scale, heading weight,
 * letter-spacing. Each maps 1:1 to a `tokens.typography.*` field.
 */
export function TypographySection() {
  const typography = useThemeBuilderStore((s) => s.tokens.typography);
  const setTokens = useThemeBuilderStore((s) => s.setTokens);
  const isOwner = useThemeBuilderStore((s) => s.isOwner);

  function patchTypography(patch: Partial<typeof typography>) {
    setTokens((prev) => ({
      ...prev,
      typography: { ...prev.typography, ...patch },
    }));
  }

  // Letter-spacing: undefined → 0; otherwise round to nearest 0.001em
  // and clamp to slider range.
  const letterSpacingSteps = React.useMemo(() => {
    const v = typography.letterSpacing ?? 0;
    const steps = Math.round(v / LS_STEP_EM);
    if (steps < LS_MIN_STEPS) return LS_MIN_STEPS;
    if (steps > LS_MAX_STEPS) return LS_MAX_STEPS;
    return steps;
  }, [typography.letterSpacing]);

  const letterSpacingLabel = `${(letterSpacingSteps * LS_STEP_EM).toFixed(3)} em`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Heading font</Label>
        <FontPicker
          value={typography.headingFamily}
          onChange={(v) =>
            patchTypography({ headingFamily: v as AllowedFontValue })
          }
          disabled={!isOwner}
          ariaLabel="Pick heading font"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Body font</Label>
        <FontPicker
          value={typography.bodyFamily}
          onChange={(v) =>
            patchTypography({ bodyFamily: v as AllowedFontValue })
          }
          disabled={!isOwner}
          ariaLabel="Pick body font"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Scale</Label>
        <ToggleGroup
          type="single"
          value={typography.scale}
          onValueChange={(v) => {
            // Radix fires "" when the user clicks the active item. Ignore —
            // scale has no "off" state.
            if (!v) return;
            patchTypography({ scale: v as TypeScale });
          }}
          disabled={!isOwner}
          variant="outline"
          className="w-full"
        >
          {SCALE_OPTIONS.map(({ value, label }) => (
            <ToggleGroupItem key={value} value={value} className="flex-1">
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-body-sm text-muted-foreground">
          Shifts heading + body sizes uniformly. Doesn&apos;t change line
          height.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Heading weight</Label>
        <ToggleGroup
          type="single"
          value={String(typography.headingWeight ?? 600)}
          onValueChange={(v) => {
            if (!v) return;
            patchTypography({
              headingWeight: Number(v) as 400 | 500 | 600 | 700,
            });
          }}
          disabled={!isOwner}
          variant="outline"
          className="w-full"
        >
          {WEIGHT_OPTIONS.map(({ value, label }) => (
            <ToggleGroupItem
              key={value}
              value={String(value)}
              className="flex-1"
              style={{ fontWeight: value }}
            >
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="type-letter-spacing">Letter spacing</Label>
          <span className="font-mono text-body-sm text-muted-foreground">
            {letterSpacingLabel}
          </span>
        </div>
        <Slider
          id="type-letter-spacing"
          min={LS_MIN_STEPS}
          max={LS_MAX_STEPS}
          step={1}
          value={[letterSpacingSteps]}
          onValueChange={(values) => {
            const v = values[0];
            if (v === undefined) return;
            // 0 = "use default" → store undefined so the token stays minimal.
            const next = v === 0 ? undefined : v * LS_STEP_EM;
            patchTypography({ letterSpacing: next });
          }}
          disabled={!isOwner}
        />
        <p className="text-body-sm text-muted-foreground">
          Negative tightens, positive loosens. 0 em is the font&apos;s
          natural spacing — each font keeps its own kerning, this is a
          uniform offset on top.
        </p>
      </div>
    </div>
  );
}
