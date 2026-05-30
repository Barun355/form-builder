import type { ColorPalette, ThemeTokensI } from "./types";

// Server-side validation extras beyond what Zod expresses. Zod handles
// shape, types, ranges. This file handles cross-field rules (size cap),
// soft warnings (contrast), and the URL allow-list belt-and-braces check.

/** Hard cap on the serialized tokens JSON. Throws past this. */
export const MAX_TOKENS_BYTES = 10_000;

/** Throws `TOKENS_TOO_LARGE` when over budget. Cheap O(1) check. */
export function assertTokensSize(tokens: ThemeTokensI): void {
  const size = JSON.stringify(tokens).length;
  if (size > MAX_TOKENS_BYTES) {
    throw new Error(`TOKENS_TOO_LARGE:${size}`);
  }
}

/**
 * URL allow-list. Tokens carry image URLs in brand.logoUrl and in any
 * `palette.{light,dark}.background.url` when the background is the image
 * variant. Zod already restricts to `https://`, but we re-check here so
 * a future code path adding a URL field can't bypass the rule.
 * Throws `INVALID_URL:<field>` on bad input.
 */
export function assertUrlsAreSafe(tokens: ThemeTokensI): void {
  if (tokens.brand.logoUrl) ensureHttps(tokens.brand.logoUrl, "brand.logoUrl");
  if (tokens.palette.light.background.type === "image") {
    ensureHttps(tokens.palette.light.background.url, "palette.light.background.url");
  }
  if (tokens.palette.dark?.background.type === "image") {
    ensureHttps(tokens.palette.dark.background.url, "palette.dark.background.url");
  }
}

function ensureHttps(url: string, field: string): void {
  // Parse-then-check. `new URL(url)` rejects malformed input AND
  // protocol-relative URLs (no base provided), and the parsed `.protocol`
  // catches non-https schemes (http, javascript:, data:, file:, etc.).
  //
  // History note: this used to be two regex checks, the second `/[ -]/`
  // intended to reject control chars but was a character RANGE from
  // space (0x20) through hyphen (0x2D), so it rejected almost any
  // real-world URL (hyphens in slugs, `%` in encoded paths, `&` in
  // query strings, etc.).
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`INVALID_URL:${field}`);
  }
  if (parsed.protocol !== "https:") throw new Error(`INVALID_URL:${field}`);
}

// ─── Contrast advisor ───────────────────────────────────────────────────
// Returns soft warnings, never throws. The editor surfaces these next to
// the affected color rows; nothing on the platform blocks publishing on a
// failed contrast — we don't want to be paternalistic, just helpful.
//
// Returns warnings grouped per mode: `light` always, `dark` only when
// `palette.dark` is set (otherwise empty array). The editor reads from
// the variant the user is currently editing.

export interface ContrastWarning {
  pair: string;
  ratio: number;
  /** WCAG threshold this pair failed (4.5 for body text, 3 for large). */
  threshold: number;
}

export interface ContrastWarningsByMode {
  light: ContrastWarning[];
  dark: ContrastWarning[];
}

export function computeContrastWarnings(tokens: ThemeTokensI): ContrastWarningsByMode {
  return {
    light: gradePalette(tokens.palette.light),
    dark: tokens.palette.dark ? gradePalette(tokens.palette.dark) : [],
  };
}

function gradePalette(p: ColorPalette): ContrastWarning[] {
  const out: ContrastWarning[] = [];
  const pairs: Array<{ pair: string; fg: string; bg: string; threshold: number }> = [
    { pair: "foreground-on-background",         fg: p.colors.foreground,        bg: p.colors.background, threshold: 4.5 },
    { pair: "muted-on-background",              fg: p.colors.mutedForeground,   bg: p.colors.background, threshold: 3 },
    { pair: "primary-foreground-on-primary",    fg: p.colors.primaryForeground, bg: p.colors.primary,    threshold: 4.5 },
    { pair: "input-text-on-input-background",   fg: p.inputs.textColor,         bg: p.inputs.backgroundColor, threshold: 4.5 },
    { pair: "error-on-background",              fg: p.colors.error,             bg: p.colors.background, threshold: 3 },
  ];
  for (const { pair, fg, bg, threshold } of pairs) {
    const ratio = contrastRatio(fg, bg);
    if (ratio < threshold) out.push({ pair, ratio: Number(ratio.toFixed(2)), threshold });
  }
  return out;
}

// ─── Color math ─────────────────────────────────────────────────────────
// Standard WCAG relative luminance + contrast ratio. Hex-only inputs.

function srgbChannel(c: number): number {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const v = hex.replace("#", "");
  if (v.length < 6) return 0;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return 0.2126 * srgbChannel(r) + 0.7152 * srgbChannel(g) + 0.0722 * srgbChannel(b);
}

export function contrastRatio(fg: string, bg: string): number {
  const lFg = relativeLuminance(fg);
  const lBg = relativeLuminance(bg);
  const [lo, hi] = lFg < lBg ? [lFg, lBg] : [lBg, lFg];
  return (hi + 0.05) / (lo + 0.05);
}
