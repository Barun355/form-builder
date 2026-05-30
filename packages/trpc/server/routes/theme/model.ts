import { z } from "zod";

// ─── tRPC-facing Zod schemas ───────────────────────────────────────────
// These wrap the service-layer schemas in @repo/theme but
// carry `.describe(...)` strings for OpenAPI / Scalar docs, and they
// EXCLUDE the `requestedBy` field (which the route handler injects from
// `ctx.user.id`, never from client input — clients cannot impersonate).

const themeCategoryEnum = z
  .enum([
    "standard",
    "branded",
    "event",
    "retro",
    "dark",
    "high_contrast",
    "minimal",
    "other",
  ])
  .describe(
    "Browsing category. Used for filter chips in the gallery; purely cosmetic.",
  );

const themeVisibilityEnum = z
  .enum(["PRIVATE", "PUBLIC"])
  .describe(
    "Discoverability. PUBLIC themes appear in the public gallery; PRIVATE themes are visible only to the owner.",
  );

// No .transform() here — zod-openapi rejects transforms in output schemas.
// The service-layer colorHex in @repo/theme does the
// lowercase normalization on writes.
const colorHex = z
  .string()
  .regex(
    /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
    "Color must be #RRGGBB or #RRGGBBAA",
  )
  .describe("Hex color #RRGGBB or #RRGGBBAA");

const httpsUrl = z
  .url()
  .refine((u) => u.startsWith("https://"), "URL must use https://")
  .describe("HTTPS-only URL");

const radius = z.number().int().min(0).max(32);
const borderWidth = z.number().int().min(0).max(8);
const shadowIntensity = z.enum(["none", "sm", "md", "lg"]);
const paddingPreset = z.enum(["snug", "comfortable", "spacious"]);
const density = z.enum(["compact", "regular", "comfortable"]);
const typeScale = z.enum(["sm", "md", "lg"]);

// Keep allow-list in sync with @repo/theme ALLOWED_FONT_VALUES.
// Duplicated here for OpenAPI clarity — the route model is what Scalar reads.
const fontFamily = z.enum([
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
]);

const brandTokensModel = z.object({
  name: z.string().trim().max(80).optional(),
  logoUrl: httpsUrl.optional(),
});

const colorTokensModel = z.object({
  background: colorHex,
  surface: colorHex,
  foreground: colorHex,
  mutedForeground: colorHex,
  primary: colorHex,
  primaryForeground: colorHex,
  accent: colorHex,
  border: colorHex,
  error: colorHex,
  success: colorHex,
});

const typographyTokensModel = z.object({
  headingFamily: fontFamily,
  bodyFamily: fontFamily,
  scale: typeScale,
  headingWeight: z
    .union([z.literal(400), z.literal(500), z.literal(600), z.literal(700)])
    .optional(),
  letterSpacing: z.number().min(-0.04).max(0.04).optional(),
});

const surfaceTokensModel = z.object({
  cardRadius: radius,
  cardShadow: shadowIntensity,
  borderWidth: borderWidth,
});

// Button + input shape (shared across light/dark modes)
const buttonStyleTokensModel = z.object({
  borderRadius: radius,
  padding: paddingPreset,
  shadow: shadowIntensity,
});

const inputStyleTokensModel = z.object({
  borderRadius: radius,
  borderWidth: borderWidth,
  padding: paddingPreset,
});

// Button + input colors (per-mode, live inside palette.{light,dark})
const buttonColorTokensModel = z.object({
  backgroundColor: colorHex,
  textColor: colorHex,
  hoverBackground: colorHex.optional(),
});

const inputColorTokensModel = z.object({
  backgroundColor: colorHex,
  textColor: colorHex,
  borderColor: colorHex,
  focusBorderColor: colorHex,
  focusRingColor: colorHex,
  helperColor: colorHex,
  errorColor: colorHex,
});

const inputColorTokensPartial = inputColorTokensModel.partial();

const backgroundTokensModel = z.discriminatedUnion("type", [
  z.object({ type: z.literal("solid"), color: colorHex }),
  z.object({
    type: z.literal("gradient"),
    from: colorHex,
    to: colorHex,
    angle: z.number().int().min(0).max(360),
  }),
  z.object({
    type: z.literal("image"),
    url: httpsUrl,
    fit: z.enum(["cover", "contain"]),
    position: z.enum([
      "top-left", "top", "top-right",
      "left", "center", "right",
      "bottom-left", "bottom", "bottom-right",
    ]),
    overlay: z
      .object({ color: colorHex, opacity: z.number().min(0).max(1) })
      .optional(),
  }),
]);

const perFieldOverridesModel = z.object({
  text: inputColorTokensPartial.optional(),
  textarea: inputColorTokensPartial.optional(),
  number: inputColorTokensPartial.optional(),
  email: inputColorTokensPartial.optional(),
  phone: inputColorTokensPartial.optional(),
  select: inputColorTokensPartial.optional(),
  checkbox: inputColorTokensPartial.optional(),
  radio: inputColorTokensPartial.optional(),
  date: inputColorTokensPartial.optional(),
  datetime: inputColorTokensPartial.optional(),
  file: inputColorTokensPartial.optional(),
});

const themeModeEnum = z
  .enum(["light", "dark", "auto"])
  .describe(
    "Mode resolution. `light` always serves the light palette; `dark` always serves dark (falls back to light if dark variant is absent); `auto` respects the viewer's `prefers-color-scheme` OS preference.",
  );

// One mode's worth of color-bearing tokens.
const colorPaletteModel = z.object({
  colors: colorTokensModel,
  buttons: buttonColorTokensModel,
  inputs: inputColorTokensModel,
  background: backgroundTokensModel,
});

export const themeTokensModel = z
  .object({
    // Shared across modes
    brand: brandTokensModel,
    typography: typographyTokensModel,
    surfaces: surfaceTokensModel,
    spacing: density,
    buttonStyle: buttonStyleTokensModel,
    inputStyle: inputStyleTokensModel,
    perField: perFieldOverridesModel,

    // Mode resolution + per-mode palettes
    mode: themeModeEnum,
    palette: z.object({
      light: colorPaletteModel,
      dark: colorPaletteModel.optional(),
    }),
  })
  .describe(
    "The full theme token document. Server compiles this to CSS variables at render time; the client never writes CSS directly. Color-bearing fields live inside `palette.{light,dark}`; non-color fields are shared across modes.",
  );

const contrastWarningModel = z.object({
  pair: z.string(),
  ratio: z.number(),
  threshold: z.number(),
});

// ─── create ────────────────────────────────────────────────────────────
export const createThemeInputModel = z.object({
  name: z.string().trim().min(1).max(80).describe("Theme name"),
  description: z.string().trim().max(255).optional(),
  category: themeCategoryEnum.optional(),
  coverImageUrl: httpsUrl.optional(),
  visibility: themeVisibilityEnum.optional(),
  tokens: themeTokensModel.optional(),
});

export const createThemeOutputModel = z.object({
  id: z.uuid(),
  name: z.string(),
  category: themeCategoryEnum,
  visibility: themeVisibilityEnum,
});

// ─── list ──────────────────────────────────────────────────────────────
export const listThemesInputModel = z.object({
  scope: z
    .enum(["mine", "public"])
    .optional()
    .describe("`mine` = owned themes, `public` = PUBLIC themes from any user"),
  category: themeCategoryEnum.optional(),
  search: z.string().trim().min(1).optional(),
  sort: z.enum(["updatedAt", "createdAt", "name"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  limit: z.number().int().min(1).max(60).optional(),
  offset: z.number().int().min(0).optional(),
});

// Compact color fingerprint for the picker swatch row. Always the
// light-palette values — the picker shows a single visual cue, not
// both modes (the theme editor handles dark editing).
const themePreviewColorsModel = z.object({
  primary: z.string(),
  surface: z.string(),
  pageBackground: z.string(),
});

const listThemeItemModel = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: themeCategoryEnum,
  visibility: themeVisibilityEnum,
  coverImageUrl: z.string().nullable(),
  createdBy: z.uuid(),
  createdByName: z.string().nullable(),
  isOwner: z.boolean(),
  previewColors: themePreviewColorsModel,
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export const listThemesOutputModel = z.object({
  items: z.array(listThemeItemModel),
  totalCount: z.number().int().nonnegative(),
});

// ─── getById ───────────────────────────────────────────────────────────
export const getThemeByIdInputModel = z.object({
  id: z.uuid(),
});

export const getThemeByIdOutputModel = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: themeCategoryEnum,
  visibility: themeVisibilityEnum,
  coverImageUrl: z.string().nullable(),
  createdBy: z.uuid(),
  createdByName: z.string().nullable(),
  isOwner: z.boolean(),
  tokens: themeTokensModel,
  // Contrast warnings per mode. `dark` is empty when `palette.dark` is
  // absent — see computeContrastWarnings in @repo/theme/validate.
  contrastWarnings: z.object({
    light: z.array(contrastWarningModel),
    dark: z.array(contrastWarningModel),
  }),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

// ─── update ────────────────────────────────────────────────────────────
export const updateThemeInputModel = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(255).nullable().optional(),
  category: themeCategoryEnum.optional(),
  coverImageUrl: httpsUrl.nullable().optional(),
  visibility: themeVisibilityEnum.optional(),
  tokens: themeTokensModel.optional(),
});

export const updateThemeOutputModel = getThemeByIdOutputModel;

// ─── soft-delete / duplicate / publish / unpublish ─────────────────────
const themeIdOnlyInput = z.object({ id: z.uuid() });

export const softDeleteThemeInputModel = themeIdOnlyInput;
export const softDeleteThemeOutputModel = z.object({
  id: z.uuid(),
  isDeleted: z.literal(true),
});

export const duplicateThemeInputModel = themeIdOnlyInput;
export const duplicateThemeOutputModel = createThemeOutputModel;

export const publishThemeInputModel = themeIdOnlyInput;
export const unpublishThemeInputModel = themeIdOnlyInput;

export const themeVisibilityOutputModel = z.object({
  id: z.uuid(),
  visibility: themeVisibilityEnum,
});

// ─── usageCount ────────────────────────────────────────────────────────
export const themeUsageCountInputModel = themeIdOnlyInput;
export const themeUsageCountOutputModel = z.object({
  count: z
    .number()
    .int()
    .nonnegative()
    .describe(
      "Number of currently-published forms whose published version's theme_id matches this theme. Used by the theme editor's snapshot-drift caption.",
    ),
});
