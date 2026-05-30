"use client";

import type { PaddingPreset, ShadowIntensity } from "@repo/theme";

import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { useThemeBuilderStore } from "../store";

const PADDING_OPTIONS: { value: PaddingPreset; label: string }[] = [
  { value: "snug", label: "Snug" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
];

const SHADOW_OPTIONS: { value: ShadowIntensity; label: string }[] = [
  { value: "none", label: "None" },
  { value: "sm", label: "Sm" },
  { value: "md", label: "Md" },
  { value: "lg", label: "Lg" },
];

const RADIUS_MIN = 0;
const RADIUS_MAX = 32;

/**
 * Buttons section — shape only. Colors flow from the semantic palette:
 * submit background reads `--sf-color-primary`, text reads
 * `--sf-color-primary-foreground`, hover reads `--sf-color-accent`. Edit
 * those in the Colors panel; this section doesn't duplicate the controls.
 *
 * Shared across light/dark modes — radius/padding/shadow apply identically
 * to both palette variants, so writes don't route through `editingMode`.
 */
export function ButtonsSection() {
  const buttonStyle = useThemeBuilderStore((s) => s.tokens.buttonStyle);
  const setTokens = useThemeBuilderStore((s) => s.setTokens);
  const isOwner = useThemeBuilderStore((s) => s.isOwner);

  function patch(next: Partial<typeof buttonStyle>) {
    setTokens((prev) => ({
      ...prev,
      buttonStyle: { ...prev.buttonStyle, ...next },
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="btn-radius">Corner radius</Label>
          <span className="font-mono text-body-sm text-muted-foreground">
            {buttonStyle.borderRadius} px
          </span>
        </div>
        <Slider
          id="btn-radius"
          min={RADIUS_MIN}
          max={RADIUS_MAX}
          step={1}
          value={[buttonStyle.borderRadius]}
          onValueChange={(values) => {
            const v = values[0];
            if (v === undefined) return;
            patch({ borderRadius: v });
          }}
          disabled={!isOwner}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Padding</Label>
        <ToggleGroup
          type="single"
          value={buttonStyle.padding}
          onValueChange={(v) => {
            if (!v) return;
            patch({ padding: v as PaddingPreset });
          }}
          disabled={!isOwner}
          variant="outline"
          className="w-full"
        >
          {PADDING_OPTIONS.map(({ value, label }) => (
            <ToggleGroupItem key={value} value={value} className="flex-1">
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Shadow</Label>
        <ToggleGroup
          type="single"
          value={buttonStyle.shadow}
          onValueChange={(v) => {
            if (!v) return;
            patch({ shadow: v as ShadowIntensity });
          }}
          disabled={!isOwner}
          variant="outline"
          className="w-full"
        >
          {SHADOW_OPTIONS.map(({ value, label }) => (
            <ToggleGroupItem key={value} value={value} className="flex-1">
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <p className="text-body-sm text-muted-foreground">
        Submit button colors come from the Colors panel — Primary
        (background), On-primary (text), Accent (hover).
      </p>
    </div>
  );
}
