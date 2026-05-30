import { z } from "zod";

const versionRowModel = z.object({
  id: z.uuid(),
  formId: z.uuid(),
  version: z.number().int().min(1),
  schema: z.unknown().describe("Form schema (FormSchemaI JSON)"),
  themeId: z
    .uuid()
    .nullable()
    .describe(
      "Theme attached to this version. null = System Default look. Live-theme model: the public form reads the attached theme's current tokens via JOIN at render time, no snapshot taken.",
    ),
  isPublished: z.boolean(),
  submissionCount: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

const versionListItemModel = z.object({
  id: z.uuid(),
  formId: z.uuid(),
  version: z.number().int().min(1),
  isPublished: z.boolean(),
  submissionCount: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

// ─── saveDraft ─────────────────────────────────────────────────────────────
export const saveDraftInputModel = z.object({
  formId: z.uuid().describe("UUID of the form being edited"),
  schema: z.unknown().describe("Form schema (FormSchemaI JSON)"),
  themeId: z
    .uuid()
    .nullable()
    .optional()
    .describe(
      "Theme to attach to this draft. Omit to leave the existing attachment alone; null to detach (System Default look); uuid to attach (verified via themeService.assertCanReference).",
    ),
});
export const saveDraftOutputModel = versionRowModel;

// ─── listVersions ──────────────────────────────────────────────────────────
export const listVersionsInputModel = z.object({
  formId: z.uuid(),
  limit: z.number().int().min(1).max(50).optional(),
  offset: z.number().int().min(0).optional(),
});
export const listVersionsOutputModel = z.object({
  items: z.array(versionListItemModel),
  totalCount: z.number().int().nonnegative(),
});

// ─── getVersion ────────────────────────────────────────────────────────────
export const getVersionInputModel = z.object({
  id: z.uuid().describe("UUID of the version to load"),
});
export const getVersionOutputModel = versionRowModel;

// ─── revertToVersion ───────────────────────────────────────────────────────
export const revertToVersionInputModel = z.object({
  id: z.uuid().describe("UUID of the target version to revert TO"),
});
export const revertToVersionOutputModel = versionRowModel;

// ─── deleteVersion ─────────────────────────────────────────────────────────
export const deleteVersionInputModel = z.object({
  id: z.uuid().describe("UUID of the version to delete"),
});
export const deleteVersionOutputModel = z.object({
  id: z.uuid(),
  deleted: z.literal(true),
});
