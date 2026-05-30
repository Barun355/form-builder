import type { ColorPalette, ThemeTokensI } from "./types";
import { SYSTEM_FONT_VALUE } from "./fonts";

// Default tokens. Matches the platform's existing look (violet primary on
// white) so a brand-new theme renders identically to the system default
// until the user changes something. Every ThemeService.create call falls
// back to this when the caller omits tokens.
//
// Light-only out of the box: `mode: "light"` and no `palette.dark`. Users
// opt in to dark by toggling Dark mode in the editor — that triggers the
// "Add dark variant" flow which clones `palette.light` into `palette.dark`.

const defaultLightPalette: ColorPalette = {
  colors: {
    background: "#ffffff",
    surface: "#f5f4f7",
    foreground: "#1a191e",
    mutedForeground: "#7c7a85",
    primary: "#6a3ce0",
    primaryForeground: "#ffffff",
    accent: "#efedf1",
    border: "#e8e6eb",
    error: "#dc4a2c",
    success: "#2ea86a",
  },
  buttons: {
    backgroundColor: "#6a3ce0",
    textColor: "#ffffff",
  },
  inputs: {
    backgroundColor: "#ffffff",
    textColor: "#1a191e",
    borderColor: "#e8e6eb",
    focusBorderColor: "#6a3ce0",
    focusRingColor: "#6a3ce033",
    helperColor: "#7c7a85",
    errorColor: "#dc4a2c",
  },
  background: { type: "solid", color: "#fafaf9" },
};

export const defaultTokens: ThemeTokensI = {
  brand: {},
  typography: {
    headingFamily: "Inter",
    bodyFamily: "Inter",
    scale: "md",
  },
  surfaces: {
    cardRadius: 12,
    cardShadow: "sm",
    borderWidth: 1,
  },
  spacing: "regular",
  buttonStyle: {
    borderRadius: 8,
    padding: "comfortable",
    shadow: "sm",
  },
  inputStyle: {
    borderRadius: 8,
    borderWidth: 1,
    padding: "comfortable",
  },
  perField: {},
  mode: "light",
  palette: {
    light: defaultLightPalette,
  },
};

// ─── Named presets ──────────────────────────────────────────────────────
// Seeded by scripts/seed-default-themes.ts under a system account. Public
// themes any user can apply. Keep these conservative — they're the public
// face of the theme builder.
//
// Minimal Light — light-only. No dark variant; mode locked to light.

export const minimalLightTokens: ThemeTokensI = {
  brand: {},
  typography: {
    headingFamily: SYSTEM_FONT_VALUE,
    bodyFamily: SYSTEM_FONT_VALUE,
    scale: "md",
  },
  surfaces: {
    cardRadius: 4,
    cardShadow: "none",
    borderWidth: 1,
  },
  spacing: "regular",
  buttonStyle: {
    borderRadius: 4,
    padding: "comfortable",
    shadow: "none",
  },
  inputStyle: {
    borderRadius: 4,
    borderWidth: 1,
    padding: "comfortable",
  },
  perField: {},
  mode: "light",
  palette: {
    light: {
      colors: {
        background: "#ffffff",
        surface: "#fafafa",
        foreground: "#111111",
        mutedForeground: "#888888",
        primary: "#111111",
        primaryForeground: "#ffffff",
        accent: "#f0f0f0",
        border: "#e0e0e0",
        error: "#c53030",
        success: "#38a169",
      },
      buttons: {
        backgroundColor: "#111111",
        textColor: "#ffffff",
      },
      inputs: {
        backgroundColor: "#ffffff",
        textColor: "#111111",
        borderColor: "#e0e0e0",
        focusBorderColor: "#111111",
        focusRingColor: "#11111122",
        helperColor: "#888888",
        errorColor: "#c53030",
      },
      background: { type: "solid", color: "#ffffff" },
    },
  },
};

// Aurora — the showcase preset for the dark-mode feature. `mode: "auto"`,
// both variants populated. Viewers in light OS preference see the violet-
// on-warm-white light palette; viewers in dark OS see the violet-on-deep-
// indigo dark palette. The non-color shape (radius, padding, shadow,
// typography) is the same in both modes.

export const auroraTokens: ThemeTokensI = {
  brand: {},
  typography: {
    headingFamily: "Geist",
    bodyFamily: "Geist",
    scale: "md",
  },
  surfaces: {
    cardRadius: 16,
    cardShadow: "md",
    borderWidth: 1,
  },
  spacing: "comfortable",
  buttonStyle: {
    borderRadius: 10,
    padding: "comfortable",
    shadow: "md",
  },
  inputStyle: {
    borderRadius: 10,
    borderWidth: 1,
    padding: "comfortable",
  },
  perField: {},
  mode: "auto",
  palette: {
    light: {
      colors: {
        background: "#fefcff",
        surface: "#ffffff",
        foreground: "#1c1727",
        mutedForeground: "#6b6477",
        primary: "#7c52f1",
        primaryForeground: "#ffffff",
        accent: "#efeafd",
        border: "#e6e0f0",
        error: "#dc4a2c",
        success: "#2ea86a",
      },
      buttons: {
        backgroundColor: "#7c52f1",
        textColor: "#ffffff",
      },
      inputs: {
        backgroundColor: "#ffffff",
        textColor: "#1c1727",
        borderColor: "#e6e0f0",
        focusBorderColor: "#7c52f1",
        focusRingColor: "#7c52f133",
        helperColor: "#6b6477",
        errorColor: "#dc4a2c",
      },
      background: { type: "solid", color: "#fbf8ff" },
    },
    dark: {
      colors: {
        background: "#121117",
        surface: "#1e1d26",
        foreground: "#f1eff5",
        mutedForeground: "#b4b1bd",
        primary: "#9d7ef0",
        primaryForeground: "#1a191e",
        accent: "#2d2d3a",
        border: "#2d2d3a",
        error: "#e0563c",
        success: "#5bc592",
      },
      buttons: {
        backgroundColor: "#9d7ef0",
        textColor: "#1a191e",
      },
      inputs: {
        backgroundColor: "#1e1d26",
        textColor: "#f1eff5",
        borderColor: "#2d2d3a",
        focusBorderColor: "#9d7ef0",
        focusRingColor: "#9d7ef033",
        helperColor: "#b4b1bd",
        errorColor: "#e0563c",
      },
      background: { type: "solid", color: "#0c0c14" },
    },
  },
};

// Backward-compat re-export. PR H removes Dark Studio from the seed
// (replaced by Aurora). Until then this alias keeps the existing seed
// script type-checking against an exported preset name.
export const darkStudioTokens = auroraTokens;
