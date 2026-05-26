import { z } from "zod";
import { formSchemaIZod } from "./schema";

// ─── saveDraft ─────────────────────────────────────────────────────────────
export const saveDraftInput = z.object({
  formId: z.uuid(),
  schema: formSchemaIZod,
  requestedBy: z.uuid(),
});
export type SaveDraftInputType = z.infer<typeof saveDraftInput>;

const versionRowOutput = z.object({
  id: z.uuid(),
  formId: z.uuid(),
  version: z.number().int().min(1),
  schema: z.unknown(),
  isPublished: z.boolean(),
  submissionCount: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});
export type VersionRowOutputType = z.infer<typeof versionRowOutput>;

export const saveDraftOutput = versionRowOutput;
export type SaveDraftOutputType = z.infer<typeof saveDraftOutput>;

// ─── list ──────────────────────────────────────────────────────────────────
export const listVersionsInput = z.object({
  formId: z.uuid(),
  requestedBy: z.uuid(),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
});
export type ListVersionsInputType = z.input<typeof listVersionsInput>;

const versionListItem = z.object({
  id: z.uuid(),
  formId: z.uuid(),
  version: z.number().int().min(1),
  isPublished: z.boolean(),
  submissionCount: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});
export type VersionListItemType = z.infer<typeof versionListItem>;

export const listVersionsOutput = z.object({
  items: z.array(versionListItem),
  totalCount: z.number().int().nonnegative(),
});
export type ListVersionsOutputType = z.infer<typeof listVersionsOutput>;

// ─── getById ───────────────────────────────────────────────────────────────
export const getVersionInput = z.object({
  id: z.uuid(),
  requestedBy: z.uuid(),
});
export type GetVersionInputType = z.infer<typeof getVersionInput>;

export const getVersionOutput = versionRowOutput;
export type GetVersionOutputType = z.infer<typeof getVersionOutput>;

// ─── revert ────────────────────────────────────────────────────────────────
export const revertToVersionInput = z.object({
  id: z.uuid(),
  requestedBy: z.uuid(),
});
export type RevertToVersionInputType = z.infer<typeof revertToVersionInput>;

export const revertToVersionOutput = versionRowOutput;
export type RevertToVersionOutputType = z.infer<typeof revertToVersionOutput>;

// ─── delete ────────────────────────────────────────────────────────────────
export const deleteVersionInput = z.object({
  id: z.uuid(),
  requestedBy: z.uuid(),
});
export type DeleteVersionInputType = z.infer<typeof deleteVersionInput>;

export const deleteVersionOutput = z.object({
  id: z.uuid(),
  deleted: z.literal(true),
});
export type DeleteVersionOutputType = z.infer<typeof deleteVersionOutput>;
