import { z } from "zod";
import { ALLOWED_FONT_VALUES } from "./fonts";
import { defaultTokens } from "./defaults";

// ─── Enum schemas ───────────────────────────────────────────────────────
// Keep in sync with the pgEnum declarations in
// packages/database/models/theme.ts and with FieldType in form-versions.ts.

export const themeCategoryEnum = z.enum([
  "standard",
  "branded",
  "event",
  "retro",
  "dark",
  "high_contrast",
  "minimal",
  "other",
]);
export type ThemeCategory = z.infer<typeof themeCategoryEnum>;

export const themeVisibilityEnum = z.enum(["PRIVATE", "PUBLIC"]);
export type ThemeVisibility = z.infer<typeof themeVisibilityEnum>;

// Field types tracked here for the perField token map. MUST mirror
// FieldType in @repo/database/models/form-versions AND ThemeFieldType in
// @repo/theme. The model layer is the only place this
// list is declared as a runtime value.
export const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "email",
  "phone",
  "select",
  "checkbox",
  "radio",
  "date",
  "datetime",
  "file",
] as const;

// ─── Primitive token schemas ────────────────────────────────────────────

/** `#rrggbb` or `#rrggbbaa`. Normalized to lowercase on parse. */
export const colorHex = z
  .string()
  .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Color must be #RRGGBB or #RRGGBBAA")
  .transform((s) => s.toLowerCase());

export const fontFamily = z.enum(ALLOWED_FONT_VALUES);

export const radius = z.number().int().min(0).max(32);
export const borderWidth = z.number().int().min(0).max(8);
export const shadowIntensity = z.enum(["none", "sm", "md", "lg"]);
export const paddingPreset = z.enum(["snug", "comfortable", "spacious"]);
export const density = z.enum(["compact", "regular", "comfortable"]);
export const typeScale = z.enum(["sm", "md", "lg"]);

/** HTTPS-only URLs. Server-side runtime validator in validate.ts re-checks. */
export const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), "URL must use https://");

// ─── Composite token schemas ────────────────────────────────────────────

const brandTokens = z.object({
  name: z.string().trim().max(80).optional(),
  logoUrl: httpsUrl.optional(),
});

const colorTokens = z.object({
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

const typographyTokens = z.object({
  headingFamily: fontFamily,
  bodyFamily: fontFamily,
  scale: typeScale,
  headingWeight: z.union([z.literal(400), z.literal(500), z.literal(600), z.literal(700)]).optional(),
  letterSpacing: z.number().min(-0.04).max(0.04).optional(),
});

const surfaceTokens = z.object({
  cardRadius: radius,
  cardShadow: shadowIntensity,
  borderWidth: borderWidth,
});

// ─── Button + Input split: shape (shared) vs colors (per-mode) ──────────

const buttonStyleTokens = z.object({
  borderRadius: radius,
  padding: paddingPreset,
  shadow: shadowIntensity,
});

const buttonColorTokens = z.object({
  backgroundColor: colorHex,
  textColor: colorHex,
  hoverBackground: colorHex.optional(),
});

const inputStyleTokens = z.object({
  borderRadius: radius,
  borderWidth: borderWidth,
  padding: paddingPreset,
});

const inputColorTokens = z.object({
  backgroundColor: colorHex,
  textColor: colorHex,
  borderColor: colorHex,
  focusBorderColor: colorHex,
  focusRingColor: colorHex,
  helperColor: colorHex,
  errorColor: colorHex,
});

// PerField overrides are color-only and apply the same in both modes
// (see implementation plan §5e). Adding per-mode-per-field is v1.x.
const inputColorTokensPartial = inputColorTokens.partial();

const backgroundTokens = z.discriminatedUnion("type", [
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

// Explicit per-key optional shape so a theme can override only the field
// types it cares about. Keys mirror FIELD_TYPES above; add new types in
// both places. Values are color-only partials of InputColorTokens.
const perFieldOverrides = z.object({
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

// ─── Palette (per-mode) and mode resolution ─────────────────────────────

export const themeModeEnum = z.enum(["light", "dark", "auto"]);
export type ThemeModeType = z.infer<typeof themeModeEnum>;

const colorPalette = z.object({
  colors: colorTokens,
  buttons: buttonColorTokens,
  inputs: inputColorTokens,
  background: backgroundTokens,
});

export const themeTokensSchema = z.object({
  // Shared (non-color)
  brand: brandTokens,
  typography: typographyTokens,
  surfaces: surfaceTokens,
  spacing: density,
  buttonStyle: buttonStyleTokens,
  inputStyle: inputStyleTokens,
  perField: perFieldOverrides,

  // Mode resolution + per-mode color palettes
  mode: themeModeEnum.default("light"),
  palette: z.object({
    light: colorPalette,
    dark: colorPalette.optional(),
  }),
});

export type ThemeTokensInputType = z.input<typeof themeTokensSchema>;
export type ThemeTokensOutputType = z.infer<typeof themeTokensSchema>;

// ─── Service input / output schemas ─────────────────────────────────────

export const createThemeInput = z.object({
  requestedBy: z.uuid(),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(255).optional(),
  category: themeCategoryEnum.default("standard"),
  coverImageUrl: httpsUrl.optional(),
  visibility: themeVisibilityEnum.default("PRIVATE"),
  tokens: themeTokensSchema.default(defaultTokens),
});
export type CreateThemeInputType = z.input<typeof createThemeInput>;

export const createThemeOutput = z.object({
  id: z.uuid(),
  name: z.string(),
  category: themeCategoryEnum,
  visibility: themeVisibilityEnum,
});
export type CreateThemeOutputType = z.infer<typeof createThemeOutput>;

// ─── list ──────────────────────────────────────────────────────────────
export const listThemesInput = z.object({
  requestedBy: z.uuid(),
  scope: z.enum(["mine", "public"]).default("mine"),
  category: themeCategoryEnum.optional(),
  search: z.string().trim().min(1).optional(),
  sort: z.enum(["updatedAt", "createdAt", "name"]).default("updatedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  limit: z.number().int().min(1).max(60).default(24),
  offset: z.number().int().min(0).default(0),
});
export type ListThemesInputType = z.input<typeof listThemesInput>;

// Compact color fingerprint sent with every list item so the picker can
// show a small swatch row without a per-theme getById round trip. Always
// the light-palette values — the picker shows a single visual hint, not
// both modes; users see the dark variant when they open the theme editor.
const themePreviewColors = z.object({
  primary: z.string(),
  surface: z.string(),
  pageBackground: z.string(),
});
export type ThemePreviewColorsType = z.infer<typeof themePreviewColors>;

const listThemeItem = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: themeCategoryEnum,
  visibility: themeVisibilityEnum,
  coverImageUrl: z.string().nullable(),
  createdBy: z.uuid(),
  createdByName: z.string().nullable(),
  isOwner: z.boolean(),
  previewColors: themePreviewColors,
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});
export type ListThemeItemType = z.infer<typeof listThemeItem>;

export const listThemesOutput = z.object({
  items: z.array(listThemeItem),
  totalCount: z.number().int().nonnegative(),
});
export type ListThemesOutputType = z.infer<typeof listThemesOutput>;

// ─── getById ───────────────────────────────────────────────────────────
export const getThemeByIdInput = z.object({
  id: z.uuid(),
  requestedBy: z.uuid(),
});
export type GetThemeByIdInputType = z.infer<typeof getThemeByIdInput>;

export const getThemeByIdOutput = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: themeCategoryEnum,
  visibility: themeVisibilityEnum,
  coverImageUrl: z.string().nullable(),
  createdBy: z.uuid(),
  createdByName: z.string().nullable(),
  isOwner: z.boolean(),
  tokens: themeTokensSchema,
  // Contrast warnings per mode. `dark` is empty when `palette.dark` is
  // absent — see computeContrastWarnings in @repo/theme/validate.
  contrastWarnings: z.object({
    light: z.array(
      z.object({
        pair: z.string(),
        ratio: z.number(),
        threshold: z.number(),
      }),
    ),
    dark: z.array(
      z.object({
        pair: z.string(),
        ratio: z.number(),
        threshold: z.number(),
      }),
    ),
  }),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});
export type GetThemeByIdOutputType = z.infer<typeof getThemeByIdOutput>;

// ─── update ────────────────────────────────────────────────────────────
export const updateThemeInput = z
  .object({
    id: z.uuid(),
    requestedBy: z.uuid(),
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(255).nullable().optional(),
    category: themeCategoryEnum.optional(),
    coverImageUrl: httpsUrl.nullable().optional(),
    visibility: themeVisibilityEnum.optional(),
    tokens: themeTokensSchema.optional(),
  })
  .refine(
    (d) =>
      d.name !== undefined ||
      d.description !== undefined ||
      d.category !== undefined ||
      d.coverImageUrl !== undefined ||
      d.visibility !== undefined ||
      d.tokens !== undefined,
    { message: "At least one field must be provided" },
  );
export type UpdateThemeInputType = z.infer<typeof updateThemeInput>;

export const updateThemeOutput = getThemeByIdOutput;
export type UpdateThemeOutputType = z.infer<typeof updateThemeOutput>;

// ─── softDelete / duplicate / publish / unpublish ──────────────────────
const themeIdAndOwner = z.object({
  id: z.uuid(),
  requestedBy: z.uuid(),
});

export const softDeleteThemeInput = themeIdAndOwner;
export type SoftDeleteThemeInputType = z.infer<typeof softDeleteThemeInput>;

export const softDeleteThemeOutput = z.object({
  id: z.uuid(),
  isDeleted: z.literal(true),
});
export type SoftDeleteThemeOutputType = z.infer<typeof softDeleteThemeOutput>;

export const duplicateThemeInput = themeIdAndOwner;
export type DuplicateThemeInputType = z.infer<typeof duplicateThemeInput>;

export const duplicateThemeOutput = createThemeOutput;
export type DuplicateThemeOutputType = z.infer<typeof duplicateThemeOutput>;

export const publishThemeInput = themeIdAndOwner;
export type PublishThemeInputType = z.infer<typeof publishThemeInput>;

export const unpublishThemeInput = themeIdAndOwner;
export type UnpublishThemeInputType = z.infer<typeof unpublishThemeInput>;

export const themeVisibilityOutput = z.object({
  id: z.uuid(),
  visibility: themeVisibilityEnum,
});
export type ThemeVisibilityOutputType = z.infer<typeof themeVisibilityOutput>;

// ─── usageCount ────────────────────────────────────────────────────────
// How many published forms are currently rendering with this theme's
// snapshot. Used by the theme editor topbar to surface a "N forms use a
// snapshot of this — changes don't affect them until re-publish" caption,
// so authors know whose look they'll be drifting from when they edit.
//
// Counts the form's PUBLISHED version (form.publishedVersionId) — drafts
// aren't viewer-visible, so they don't represent "in-the-wild" usage.
// Soft-deleted forms are excluded. Cross-tenant by design for PUBLIC
// themes (counts other users' published forms too) — counts are aggregate
// and don't leak which user owns the consuming forms.
export const themeUsageCountInput = z.object({
  id: z.uuid(),
  requestedBy: z.uuid(),
});
export type ThemeUsageCountInputType = z.infer<typeof themeUsageCountInput>;

export const themeUsageCountOutput = z.object({
  count: z.number().int().nonnegative(),
});
export type ThemeUsageCountOutputType = z.infer<typeof themeUsageCountOutput>;

// ─── assertCanReference — used by form / form-versions writers ─────────
// Not a tRPC procedure; the form service layer calls this directly to
// validate any themeId the client supplies before persisting it on a
// form_versions row. See ThemeService.assertCanReference for semantics.
export const assertCanReferenceInput = z.object({
  id: z.uuid(),
  requestedBy: z.uuid(),
});
export type AssertCanReferenceInputType = z.infer<typeof assertCanReferenceInput>;
