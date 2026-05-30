"use client";

import * as React from "react";
import type { BackgroundTokens } from "@repo/theme";

import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { Separator } from "~/components/ui/separator";
import { ColorPicker } from "../color-picker";
import {
  PositionGrid,
  type ImagePosition,
} from "../position-grid";
import { useThemeBuilderStore } from "../store";
import { AddDarkVariantCTA } from "../add-dark-variant-cta";

type BgType = BackgroundTokens["type"];

const TYPE_OPTIONS: { value: BgType; label: string }[] = [
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
  { value: "image", label: "Image" },
];

const FIT_OPTIONS: { value: "cover" | "contain"; label: string }[] = [
  { value: "cover", label: "Cover" },
  { value: "contain", label: "Contain" },
];

// Fresh defaults used when the user switches between branches of the
// discriminated union. Anchored on Aurora's light palette to land on
// values that look reasonable out of the box.
const FRESH_DEFAULTS: Record<BgType, BackgroundTokens> = {
  solid: { type: "solid", color: "#fbf8ff" },
  gradient: {
    type: "gradient",
    from: "#fbf8ff",
    to: "#efeafd",
    angle: 135,
  },
  image: {
    type: "image",
    url: "",
    fit: "cover",
    position: "center",
  },
};

/**
 * Background section — per-mode discriminated union editor. Owns the
 * `palette[mode].background` slot; the page background outside the form
 * card paints from here via the compiler's `--sf-page-bg` variable.
 *
 * Branches:
 *   - Solid    — one ColorPicker
 *   - Gradient — two ColorPickers + angle slider
 *   - Image    — URL + fit + 3×3 position grid + optional overlay
 *
 * Type switches install fresh defaults of the new branch (no migration
 * of the previous values — switching back and forth is destructive by
 * design; v1.x can add per-branch state preservation if anyone asks).
 */
export function BackgroundSection() {
  const editingMode = useThemeBuilderStore((s) => s.editingMode);
  const palette = useThemeBuilderStore((s) => s.tokens.palette);
  const setTokens = useThemeBuilderStore((s) => s.setTokens);
  const isOwner = useThemeBuilderStore((s) => s.isOwner);
  const addDarkVariant = useThemeBuilderStore((s) => s.addDarkVariant);

  const activePalette = palette[editingMode];

  function setBackground(updater: (prev: BackgroundTokens) => BackgroundTokens) {
    setTokens((prev) => {
      const current = prev.palette[editingMode];
      if (!current) return prev;
      return {
        ...prev,
        palette: {
          ...prev.palette,
          [editingMode]: {
            ...current,
            background: updater(current.background),
          },
        },
      };
    });
  }

  function setType(next: BgType) {
    setBackground(() => FRESH_DEFAULTS[next]);
  }

  if (editingMode === "dark" && !activePalette) {
    return <AddDarkVariantCTA onAdd={addDarkVariant} disabled={!isOwner} />;
  }

  const bg = activePalette!.background;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Type</Label>
        <ToggleGroup
          type="single"
          value={bg.type}
          onValueChange={(v) => {
            if (!v) return;
            setType(v as BgType);
          }}
          disabled={!isOwner}
          variant="outline"
          className="w-full"
        >
          {TYPE_OPTIONS.map(({ value, label }) => (
            <ToggleGroupItem key={value} value={value} className="flex-1">
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-body-sm text-muted-foreground">
          Switching type replaces the current background with fresh defaults
          of the new type.
        </p>
      </div>

      <Separator className="my-1" />

      {bg.type === "solid" ? (
        <SolidEditor
          value={bg.color}
          onChange={(color) =>
            setBackground(() => ({ type: "solid", color }))
          }
          disabled={!isOwner}
        />
      ) : null}

      {bg.type === "gradient" ? (
        <GradientEditor
          value={bg}
          onChange={(next) => setBackground(() => next)}
          disabled={!isOwner}
        />
      ) : null}

      {bg.type === "image" ? (
        <ImageEditor
          value={bg}
          onChange={(next) => setBackground(() => next)}
          disabled={!isOwner}
        />
      ) : null}
    </div>
  );
}

// ─── Solid ──────────────────────────────────────────────────────────────

function SolidEditor({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (hex: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
      <ColorPicker
        value={value}
        onChange={onChange}
        disabled={disabled}
        ariaLabel="Pick page background color"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-foreground">
          Page background color
        </p>
        <p className="truncate text-body-sm text-muted-foreground">
          Paints behind the form card across the full viewport.
        </p>
      </div>
      <span className="shrink-0 font-mono text-body-sm text-muted-foreground">
        {value}
      </span>
    </div>
  );
}

// ─── Gradient ───────────────────────────────────────────────────────────

function GradientEditor({
  value,
  onChange,
  disabled,
}: {
  value: Extract<BackgroundTokens, { type: "gradient" }>;
  onChange: (next: Extract<BackgroundTokens, { type: "gradient" }>) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Live preview swatch */}
      <div
        className="h-16 w-full rounded-md border border-border"
        style={{
          background: `linear-gradient(${value.angle}deg, ${value.from}, ${value.to})`,
        }}
        aria-label="Gradient preview"
      />

      <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
        <ColorPicker
          value={value.from}
          onChange={(from) => onChange({ ...value, from })}
          disabled={disabled}
          ariaLabel="Pick gradient start color"
        />
        <div className="min-w-0 flex-1">
          <p className="text-body font-medium text-foreground">From</p>
        </div>
        <span className="shrink-0 font-mono text-body-sm text-muted-foreground">
          {value.from}
        </span>
      </div>

      <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
        <ColorPicker
          value={value.to}
          onChange={(to) => onChange({ ...value, to })}
          disabled={disabled}
          ariaLabel="Pick gradient end color"
        />
        <div className="min-w-0 flex-1">
          <p className="text-body font-medium text-foreground">To</p>
        </div>
        <span className="shrink-0 font-mono text-body-sm text-muted-foreground">
          {value.to}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="grad-angle">Angle</Label>
          <span className="font-mono text-body-sm text-muted-foreground">
            {value.angle}°
          </span>
        </div>
        <Slider
          id="grad-angle"
          min={0}
          max={360}
          step={15}
          value={[value.angle]}
          onValueChange={(values) => {
            const v = values[0];
            if (v === undefined) return;
            onChange({ ...value, angle: v });
          }}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// ─── Image ──────────────────────────────────────────────────────────────

function ImageEditor({
  value,
  onChange,
  disabled,
}: {
  value: Extract<BackgroundTokens, { type: "image" }>;
  onChange: (next: Extract<BackgroundTokens, { type: "image" }>) => void;
  disabled: boolean;
}) {
  const [urlInput, setUrlInput] = React.useState(value.url);

  // Keep local input in sync when value changes externally (e.g. discard).
  React.useEffect(() => {
    setUrlInput(value.url);
  }, [value.url]);

  const isHttps = urlInput.trim().startsWith("https://");
  const showInvalid = urlInput.trim().length > 0 && !isHttps;

  function commitUrl() {
    const trimmed = urlInput.trim();
    if (trimmed !== value.url) onChange({ ...value, url: trimmed });
  }

  const overlayEnabled = value.overlay !== undefined;

  return (
    <div className="flex flex-col gap-3">
      {/* Thumbnail preview — bare URL composited with overlay if present.
          When invalid, show a placeholder swatch instead. */}
      <div
        className="h-24 w-full rounded-md border border-border bg-muted/40"
        style={
          isHttps && urlInput.trim().length > 0
            ? {
                backgroundImage: value.overlay
                  ? `linear-gradient(${withAlpha(value.overlay.color, value.overlay.opacity)}, ${withAlpha(value.overlay.color, value.overlay.opacity)}), url("${value.url}")`
                  : `url("${value.url}")`,
                backgroundSize: value.fit,
                backgroundPosition: positionToCss(value.position),
                backgroundRepeat: "no-repeat",
              }
            : undefined
        }
        aria-label="Image preview"
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="bg-url">Image URL</Label>
        <Input
          id="bg-url"
          type="url"
          placeholder="https://example.com/cover.jpg"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onBlur={commitUrl}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          disabled={disabled}
          className={showInvalid ? "border-warning" : ""}
        />
        {showInvalid ? (
          <p className="text-body-sm text-warning">
            URL must start with <code>https://</code>. Save will reject
            anything else.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Fit</Label>
        <ToggleGroup
          type="single"
          value={value.fit}
          onValueChange={(v) => {
            if (!v) return;
            onChange({ ...value, fit: v as "cover" | "contain" });
          }}
          disabled={disabled}
          variant="outline"
          className="w-full"
        >
          {FIT_OPTIONS.map(({ value: fit, label }) => (
            <ToggleGroupItem key={fit} value={fit} className="flex-1">
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Position</Label>
        <PositionGrid
          value={value.position}
          onChange={(position: ImagePosition) =>
            onChange({ ...value, position })
          }
          disabled={disabled}
        />
      </div>

      <Separator className="my-1" />

      <div className="flex items-center gap-2">
        <Checkbox
          id="bg-overlay"
          checked={overlayEnabled}
          onCheckedChange={(checked) => {
            if (checked) {
              onChange({
                ...value,
                overlay: { color: "#000000", opacity: 0.4 },
              });
            } else {
              const { overlay: _omit, ...rest } = value;
              onChange(rest);
            }
          }}
          disabled={disabled}
        />
        <Label htmlFor="bg-overlay" className="cursor-pointer">
          Add overlay
        </Label>
      </div>
      <p className="text-body-sm text-muted-foreground">
        Overlay darkens busy images so text on the card stays readable.
      </p>

      {overlayEnabled && value.overlay ? (
        <OverlayEditor
          color={value.overlay.color}
          opacity={value.overlay.opacity}
          onChange={(color, opacity) =>
            onChange({ ...value, overlay: { color, opacity } })
          }
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}

function OverlayEditor({
  color,
  opacity,
  onChange,
  disabled,
}: {
  color: string;
  opacity: number;
  onChange: (color: string, opacity: number) => void;
  disabled: boolean;
}) {
  // Slider is 0–100; stored as 0–1 float in tokens.
  const opacityPct = Math.round(opacity * 100);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
        <ColorPicker
          value={color}
          onChange={(c) => onChange(c, opacity)}
          disabled={disabled}
          ariaLabel="Pick overlay color"
        />
        <div className="min-w-0 flex-1">
          <p className="text-body font-medium text-foreground">
            Overlay color
          </p>
        </div>
        <span className="shrink-0 font-mono text-body-sm text-muted-foreground">
          {color}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="overlay-opacity">Opacity</Label>
          <span className="font-mono text-body-sm text-muted-foreground">
            {opacityPct}%
          </span>
        </div>
        <Slider
          id="overlay-opacity"
          min={0}
          max={100}
          step={5}
          value={[opacityPct]}
          onValueChange={(values) => {
            const v = values[0];
            if (v === undefined) return;
            onChange(color, v / 100);
          }}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────

const POSITION_TO_CSS: Record<ImagePosition, string> = {
  "top-left": "top left",
  top: "top center",
  "top-right": "top right",
  left: "center left",
  center: "center center",
  right: "center right",
  "bottom-left": "bottom left",
  bottom: "bottom center",
  "bottom-right": "bottom right",
};

function positionToCss(p: ImagePosition): string {
  return POSITION_TO_CSS[p];
}

// Local copy of withAlpha for the inline preview thumbnail — same logic
// as the compiler's helper. Duplicated rather than imported because the
// preview composites at the React layer, not the compiled-CSS layer.
function withAlpha(hex: string, alpha: number): string {
  const v = hex.replace("#", "");
  if (v.length < 6) return hex;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}
