import { z } from "zod";

const versionRowModel = z.object({
  id: z.uuid(),
  formId: z.uuid(),
  version: z.number().int().min(1),
  schema: z.unknown().describe("Form schema (FormSchemaI JSON)"),
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
// Schema-only. Theme attachment is a property of the form (see
// form.setTheme), not of a version.
export const saveDraftInputModel = z.object({
  formId: z.uuid().describe("UUID of the form being edited"),
  schema: z.unknown().describe("Form schema (FormSchemaI JSON)"),
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
