"use client";

import { Separator } from "~/components/ui/separator";
import type { PaddingPreset } from "@repo/theme";

import { Label } from "~/components/ui/label";
import { Slider } from "~/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { useThemeBuilderStore } from "../store";
import { ColorPicker } from "../color-picker";
import { AddDarkVariantCTA } from "../add-dark-variant-cta";

const PADDING_OPTIONS: { value: PaddingPreset; label: string }[] = [
  { value: "snug", label: "Snug" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
];

const RADIUS_MIN = 0;
const RADIUS_MAX = 24;
const BORDER_WIDTH_MIN = 0;
const BORDER_WIDTH_MAX = 4;

/**
 * Inputs section — shape (shared) + a minimal colors subgroup (per-mode).
 *
 * Most input colors flow from the semantic palette:
 *   - text       → `--sf-color-foreground`
 *   - border     → `--sf-color-border`
 *   - focus border + ring → `--sf-color-primary`
 *   - helper text → `--sf-color-muted-foreground`
 *   - error text  → `--sf-color-error`
 *
 * Only `inputs.backgroundColor` has no semantic equivalent (an input bg
 * can legitimately differ from the form card surface — white inputs on a
 * dark card is a common pattern). That single value lives here, behind
 * the dark-variant gate when editing the dark palette.
 */
export function InputsSection() {
  const inputStyle = useThemeBuilderStore((s) => s.tokens.inputStyle);
  const setTokens = useThemeBuilderStore((s) => s.setTokens);
  const isOwner = useThemeBuilderStore((s) => s.isOwner);

  // Per-mode bits.
  const editingMode = useThemeBuilderStore((s) => s.editingMode);
  const palette = useThemeBuilderStore((s) => s.tokens.palette);
  const addDarkVariant = useThemeBuilderStore((s) => s.addDarkVariant);
  const activePalette = palette[editingMode];

  function patchStyle(next: Partial<typeof inputStyle>) {
    setTokens((prev) => ({
      ...prev,
      inputStyle: { ...prev.inputStyle, ...next },
    }));
  }

  function setInputBg(hex: string) {
    setTokens((prev) => {
      const current = prev.palette[editingMode];
      if (!current) return prev;
      return {
        ...prev,
        palette: {
          ...prev.palette,
          [editingMode]: {
            ...current,
            inputs: { ...current.inputs, backgroundColor: hex },
          },
        },
      };
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ─── Shape (shared) ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="input-radius">Corner radius</Label>
          <span className="font-mono text-body-sm text-muted-foreground">
            {inputStyle.borderRadius} px
          </span>
        </div>
        <Slider
          id="input-radius"
          min={RADIUS_MIN}
          max={RADIUS_MAX}
          step={1}
          value={[inputStyle.borderRadius]}
          onValueChange={(values) => {
            const v = values[0];
            if (v === undefined) return;
            patchStyle({ borderRadius: v });
          }}
          disabled={!isOwner}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="input-border-width">Border width</Label>
          <span className="font-mono text-body-sm text-muted-foreground">
            {inputStyle.borderWidth} px
          </span>
        </div>
        <Slider
          id="input-border-width"
          min={BORDER_WIDTH_MIN}
          max={BORDER_WIDTH_MAX}
          step={1}
          value={[inputStyle.borderWidth]}
          onValueChange={(values) => {
            const v = values[0];
            if (v === undefined) return;
            patchStyle({ borderWidth: v });
          }}
          disabled={!isOwner}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Padding</Label>
        <ToggleGroup
          type="single"
          value={inputStyle.padding}
          onValueChange={(v) => {
            if (!v) return;
            patchStyle({ padding: v as PaddingPreset });
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

      {/* ─── Colors (per-mode) ───────────────────────────────────────── */}
      <Separator className="my-1" />
      <p className="text-caps uppercase text-muted-foreground">
        Colors ({editingMode})
      </p>

      {editingMode === "dark" && !activePalette ? (
        <AddDarkVariantCTA
          onAdd={addDarkVariant}
          disabled={!isOwner}
        />
      ) : (
        <div className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40">
          <ColorPicker
            value={activePalette!.inputs.backgroundColor}
            onChange={setInputBg}
            disabled={!isOwner}
            ariaLabel="Pick input background color"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-medium text-foreground">
              Input background
            </p>
            <p className="truncate text-body-sm text-muted-foreground">
              The fill color inside each field. Often white on light cards
              and slightly lighter than surface on dark cards.
            </p>
          </div>
          <span className="shrink-0 font-mono text-body-sm text-muted-foreground">
            {activePalette!.inputs.backgroundColor}
          </span>
        </div>
      )}

      <p className="text-body-sm text-muted-foreground">
        Input text, border, focus, helper, and error colors come from the
        Colors panel (Text, Border, Primary, Muted text, Error).
      </p>
    </div>
  );
}
