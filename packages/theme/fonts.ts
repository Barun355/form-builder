// Curated font allow-list. Constraining the set lets us:
//   1. Validate font family names at write time (no arbitrary strings).
//   2. Cap the third-party Google Fonts download surface on the public form.
//   3. Show non-technical users a focused picker instead of paralysis.
//
// "System UI" is the no-third-party-load option. It maps to no Google Fonts
// link injection at all; the renderer just uses `system-ui` and the OS picks.
//
// Adding fonts: append to the array. The string in `value` becomes a
// PostgreSQL-stored constant that's hard to migrate, so think before you
// rename. The string in `family` is the literal Google Fonts family name.

export const SYSTEM_FONT_VALUE = "System UI" as const;

export type FontCategory = "sans" | "serif" | "mono" | "system";

export interface FontEntry {
  /** Persistence value. NEVER renamed — stored in token JSON. */
  value: string;
  /** Literal Google Fonts family name, used to build the CSS URL. */
  family: string;
  /** CSS font-family stack output by the compiler. Includes a safe fallback. */
  stack: string;
  category: FontCategory;
  /** Subset of weights we pull. Keeps payload small. */
  weights: number[];
}

export const FONTS: readonly FontEntry[] = [
  // System
  {
    value: SYSTEM_FONT_VALUE,
    family: "",
    stack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    category: "system",
    weights: [],
  },

  // Sans
  { value: "Inter",              family: "Inter",              stack: "'Inter', system-ui, sans-serif",            category: "sans",  weights: [400, 500, 600, 700] },
  { value: "DM Sans",            family: "DM Sans",            stack: "'DM Sans', system-ui, sans-serif",          category: "sans",  weights: [400, 500, 600, 700] },
  { value: "Geist",              family: "Geist",              stack: "'Geist', 'Inter', system-ui, sans-serif",   category: "sans",  weights: [400, 500, 600, 700] },
  { value: "Space Grotesk",      family: "Space Grotesk",      stack: "'Space Grotesk', system-ui, sans-serif",    category: "sans",  weights: [400, 500, 600, 700] },
  { value: "Plus Jakarta Sans",  family: "Plus Jakarta Sans",  stack: "'Plus Jakarta Sans', system-ui, sans-serif",category: "sans",  weights: [400, 500, 600, 700] },
  { value: "Manrope",            family: "Manrope",            stack: "'Manrope', system-ui, sans-serif",          category: "sans",  weights: [400, 500, 600, 700] },
  { value: "Outfit",             family: "Outfit",             stack: "'Outfit', system-ui, sans-serif",           category: "sans",  weights: [400, 500, 600, 700] },
  { value: "Lato",               family: "Lato",               stack: "'Lato', system-ui, sans-serif",             category: "sans",  weights: [400, 700] },
  { value: "Open Sans",          family: "Open Sans",          stack: "'Open Sans', system-ui, sans-serif",        category: "sans",  weights: [400, 600, 700] },
  { value: "Roboto",             family: "Roboto",             stack: "'Roboto', system-ui, sans-serif",           category: "sans",  weights: [400, 500, 700] },
  { value: "Poppins",            family: "Poppins",            stack: "'Poppins', system-ui, sans-serif",          category: "sans",  weights: [400, 500, 600, 700] },
  { value: "Montserrat",         family: "Montserrat",         stack: "'Montserrat', system-ui, sans-serif",       category: "sans",  weights: [400, 500, 600, 700] },
  { value: "Nunito",             family: "Nunito",             stack: "'Nunito', system-ui, sans-serif",           category: "sans",  weights: [400, 600, 700] },

  // Serif
  { value: "Playfair Display",   family: "Playfair Display",   stack: "'Playfair Display', Georgia, serif",        category: "serif", weights: [400, 600, 700] },
  { value: "Lora",               family: "Lora",               stack: "'Lora', Georgia, serif",                    category: "serif", weights: [400, 500, 700] },
  { value: "Merriweather",       family: "Merriweather",       stack: "'Merriweather', Georgia, serif",            category: "serif", weights: [400, 700] },
  { value: "Cormorant Garamond", family: "Cormorant Garamond", stack: "'Cormorant Garamond', Georgia, serif",      category: "serif", weights: [400, 500, 600] },

  // Mono
  { value: "JetBrains Mono",     family: "JetBrains Mono",     stack: "'JetBrains Mono', ui-monospace, monospace", category: "mono",  weights: [400, 500, 700] },
  { value: "Fira Code",          family: "Fira Code",          stack: "'Fira Code', ui-monospace, monospace",      category: "mono",  weights: [400, 500, 700] },
  { value: "Geist Mono",         family: "Geist Mono",         stack: "'Geist Mono', ui-monospace, monospace",     category: "mono",  weights: [400, 500, 700] },
] as const;

// ALLOWED_FONT_VALUES + AllowedFontValue live in ./enums (the source of
// truth for the literal union used by both the token TypeScript type and
// the Zod runtime validator). Re-exported here for convenience.
export { ALLOWED_FONT_VALUES, type AllowedFontValue } from "./enums";

const FONT_INDEX = new Map(FONTS.map((f) => [f.value, f] as const));

/** Look up a single font by stored value. Falls back to System UI. */
export function getFontEntry(value: string): FontEntry {
  return FONT_INDEX.get(value) ?? FONT_INDEX.get(SYSTEM_FONT_VALUE)!;
}

/** CSS `font-family` stack string for a stored value. Safe for inline CSS. */
export function getFontStack(value: string): string {
  return getFontEntry(value).stack;
}

/**
 * Build the Google Fonts CSS URL for a set of family names.
 * Returns null when no non-system fonts are requested (so the renderer
 * skips mounting a stylesheet link entirely).
 */
export function buildFontHref(families: string[]): string | null {
  const wanted = new Set<string>();
  for (const v of families) {
    const entry = FONT_INDEX.get(v);
    if (!entry || entry.category === "system") continue;
    wanted.add(entry.value);
  }
  if (wanted.size === 0) return null;

  const parts: string[] = [];
  for (const v of wanted) {
    const entry = FONT_INDEX.get(v)!;
    const fam = entry.family.replace(/ /g, "+");
    const weights = entry.weights.length ? `:wght@${entry.weights.join(";")}` : "";
    parts.push(`family=${fam}${weights}`);
  }
  // `display=swap` so the form is never blocked on font download.
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}
