// Font allow-list. Const-tuple shape so Zod's `z.enum()` and TypeScript
// both infer the literal union ("Inter" | "DM Sans" | ...) instead of
// widening to plain `string`. Add a font in BOTH this tuple and the
// FONTS array in ./fonts.ts (unit-test invariant in PR 16 will assert
// the two match).
export const ALLOWED_FONT_VALUES = [
  "System UI",
  "Inter",
  "DM Sans",
  "Geist",
  "Space Grotesk",
  "Plus Jakarta Sans",
  "Manrope",
  "Outfit",
  "Lato",
  "Open Sans",
  "Roboto",
  "Poppins",
  "Montserrat",
  "Nunito",
  "Playfair Display",
  "Lora",
  "Merriweather",
  "Cormorant Garamond",
  "JetBrains Mono",
  "Fira Code",
  "Geist Mono",
] as const;

export type AllowedFontValue = (typeof ALLOWED_FONT_VALUES)[number];

// Field types overrideable in the perField map. Mirrors FieldType in
// @repo/database/models/form-versions.ts — kept here so this package has
// no value-level dep on @repo/database. If you add a FieldType, add it
// here too (the FIELD_TYPES tuple in ./model.ts pulls from this).
export type ThemeFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "datetime"
  | "file";
