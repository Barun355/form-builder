"use client";

import type { Density, ShadowIntensity } from "@repo/theme";

import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { useThemeBuilderStore } from "../store";

const SHADOW_OPTIONS: { value: ShadowIntensity; label: string }[] = [
  { value: "none", label: "None" },
  { value: "sm", label: "Sm" },
  { value: "md", label: "Md" },
  { value: "lg", label: "Lg" },
];

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "regular", label: "Regular" },
  { value: "comfortable", label: "Comfortable" },
];

const CARD_RADIUS_MIN = 0;
const CARD_RADIUS_MAX = 32;
const BORDER_WIDTH_MIN = 0;
const BORDER_WIDTH_MAX = 4;

/**
 * Surfaces & spacing — form card chrome (corner radius, shadow, border
 * width) plus density (gap between sections and fields). Fully shared
 * across light/dark; no per-mode routing.
 */
export function SurfacesSection() {
  const surfaces = useThemeBuilderStore((s) => s.tokens.surfaces);
  const spacing = useThemeBuilderStore((s) => s.tokens.spacing);
  const setTokens = useThemeBuilderStore((s) => s.setTokens);
  const isOwner = useThemeBuilderStore((s) => s.isOwner);

  function patchSurfaces(next: Partial<typeof surfaces>) {
    setTokens((prev) => ({
      ...prev,
      surfaces: { ...prev.surfaces, ...next },
    }));
  }

  function setSpacing(next: Density) {
    setTokens((prev) => ({ ...prev, spacing: next }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="card-radius">Card corner radius</Label>
          <span className="font-mono text-body-sm text-muted-foreground">
            {surfaces.cardRadius} px
          </span>
        </div>
        <Slider
          id="card-radius"
          min={CARD_RADIUS_MIN}
          max={CARD_RADIUS_MAX}
          step={1}
          value={[surfaces.cardRadius]}
          onValueChange={(values) => {
            const v = values[0];
            if (v === undefined) return;
            patchSurfaces({ cardRadius: v });
          }}
          disabled={!isOwner}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Card shadow</Label>
        <ToggleGroup
          type="single"
          value={surfaces.cardShadow}
          onValueChange={(v) => {
            if (!v) return;
            patchSurfaces({ cardShadow: v as ShadowIntensity });
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="card-border-width">Card border width</Label>
          <span className="font-mono text-body-sm text-muted-foreground">
            {surfaces.borderWidth} px
          </span>
        </div>
        <Slider
          id="card-border-width"
          min={BORDER_WIDTH_MIN}
          max={BORDER_WIDTH_MAX}
          step={1}
          value={[surfaces.borderWidth]}
          onValueChange={(values) => {
            const v = values[0];
            if (v === undefined) return;
            patchSurfaces({ borderWidth: v });
          }}
          disabled={!isOwner}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Density</Label>
        <ToggleGroup
          type="single"
          value={spacing}
          onValueChange={(v) => {
            if (!v) return;
            setSpacing(v as Density);
          }}
          disabled={!isOwner}
          variant="outline"
          className="w-full"
        >
          {DENSITY_OPTIONS.map(({ value, label }) => (
            <ToggleGroupItem key={value} value={value} className="flex-1">
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-body-sm text-muted-foreground">
          Controls the gap between sections and fields. Compact tightens
          everything; comfortable opens it up.
        </p>
      </div>
    </div>
  );
}
