import type { AllowedFontValue, ThemeFieldType } from "./enums";

// ─── Token document shape ───────────────────────────────────────────────
// The structured JSON theme document. The server compiles this into scoped
// CSS at render time; the client never writes CSS directly. Treat this
// shape as a stable contract from v1 onward — adding optional fields is
// safe, renaming or removing is a migration.
//
// ─── Light / dark variants ──────────────────────────────────────────────
// Color-bearing fields (colors, button colors, input colors, background)
// live inside `palette.light` and (optionally) `palette.dark`. Non-color
// fields (typography, surfaces, spacing, brand, perField shape, button
// shape, input shape) are shared across modes.
//
// `mode` decides which variant the public form serves:
//   - "light" (default) — always light, ignores viewer preference.
//   - "dark"            — always dark, falls back to light if `palette.dark` is absent.
//   - "auto"            — light by default, dark when viewer's OS prefers dark
//                         (only if `palette.dark` is set; otherwise stays light).
//
// See packages/theme/compile.ts for the emission strategy and
// .claude/plan/theme-builder/theme-dark-mode-implementation.md for the
// full design.

// String at the type level so it survives Drizzle's jsonb $type<>() and
// Zod's transformed string output. Runtime shape (#RRGGBB / #RRGGBBAA) is
// enforced by the `colorHex` Zod schema in ./model.ts — every write path
// parses through it before persisting.
export type ColorHex = string;

export type ShadowIntensity = "none" | "sm" | "md" | "lg";

export type PaddingPreset = "snug" | "comfortable" | "spacious";

export type Density = "compact" | "regular" | "comfortable";

export type TypeScale = "sm" | "md" | "lg";

export type ThemeMode = "light" | "dark" | "auto";

// ─── Shared (across light/dark modes) ───────────────────────────────────

export interface BrandTokens {
  name?: string;
  logoUrl?: string;
}

export interface TypographyTokens {
  headingFamily: AllowedFontValue;
  bodyFamily: AllowedFontValue;
  scale: TypeScale;
  headingWeight?: 400 | 500 | 600 | 700;
  letterSpacing?: number;
}

export interface SurfaceTokens {
  cardRadius: number;
  cardShadow: ShadowIntensity;
  borderWidth: number;
}

/** Button shape (non-color). Shared across modes. */
export interface ButtonStyleTokens {
  borderRadius: number;
  padding: PaddingPreset;
  shadow: ShadowIntensity;
}

/** Input shape (non-color). Shared across modes. */
export interface InputStyleTokens {
  borderRadius: number;
  borderWidth: number;
  padding: PaddingPreset;
}

// ─── Per-mode (color-bearing) ───────────────────────────────────────────

export interface ColorTokens {
  background: ColorHex;
  surface: ColorHex;
  foreground: ColorHex;
  mutedForeground: ColorHex;
  primary: ColorHex;
  primaryForeground: ColorHex;
  accent: ColorHex;
  border: ColorHex;
  error: ColorHex;
  success: ColorHex;
}

/** Button colors only. Shape (radius, padding, shadow) lives on ButtonStyleTokens. */
export interface ButtonColorTokens {
  backgroundColor: ColorHex;
  textColor: ColorHex;
  hoverBackground?: ColorHex;
}

/** Input colors only. Shape (radius, padding, borderWidth) lives on InputStyleTokens. */
export interface InputColorTokens {
  backgroundColor: ColorHex;
  textColor: ColorHex;
  borderColor: ColorHex;
  focusBorderColor: ColorHex;
  focusRingColor: ColorHex;
  helperColor: ColorHex;
  errorColor: ColorHex;
}

export type BackgroundTokens =
  | { type: "solid"; color: ColorHex }
  | {
      type: "gradient";
      from: ColorHex;
      to: ColorHex;
      angle: number;
    }
  | {
      type: "image";
      url: string;
      fit: "cover" | "contain";
      position:
        | "top-left" | "top" | "top-right"
        | "left" | "center" | "right"
        | "bottom-left" | "bottom" | "bottom-right";
      overlay?: { color: ColorHex; opacity: number };
    };

/** One mode's worth of color-bearing tokens. */
export interface ColorPalette {
  colors: ColorTokens;
  buttons: ButtonColorTokens;
  inputs: InputColorTokens;
  background: BackgroundTokens;
}

// Per-field-type overrides — color-only (applies the same in both modes).
// Shape overrides (radius, padding, borderWidth) per field aren't a v1
// feature; that's a v1.x extension if anyone asks.
export type PerFieldOverrides = {
  [K in ThemeFieldType]?: Partial<InputColorTokens>;
};

// ─── Top-level document ─────────────────────────────────────────────────

export interface ThemeTokensI {
  // Shared (non-color):
  brand: BrandTokens;
  typography: TypographyTokens;
  surfaces: SurfaceTokens;
  spacing: Density;
  buttonStyle: ButtonStyleTokens;
  inputStyle: InputStyleTokens;
  perField: PerFieldOverrides;

  // Mode resolution (see top-of-file comment for cascade rules).
  mode: ThemeMode;

  // Per-mode color palettes. `light` is required; `dark` is opt-in.
  palette: {
    light: ColorPalette;
    dark?: ColorPalette;
  };
}

// Alias kept for the Drizzle jsonb `$type<>()` narrowing in
// @repo/database/models/form-versions.ts. Identical to ThemeTokensI.
export type ThemeTokensType = ThemeTokensI;
