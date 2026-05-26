import { z } from "zod";

const clientMetaSchema = z
  .object({
    deviceType: z.string().optional(),
    browser: z.string().optional(),
    os: z.string().optional(),
    locale: z.string().optional(),
    timezone: z.string().optional(),
    referrer: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    userAgent: z.string().optional(),
    screenResolution: z.string().optional(),
  })
  .optional();

// ─── start ─────────────────────────────────────────────────────────────────
export const startSubmissionInput = z.object({
  versionId: z.uuid(),
  meta: clientMetaSchema,
  honeypot: z.string().optional(),
});
export type StartSubmissionInputType = z.infer<typeof startSubmissionInput>;

export const startSubmissionOutput = z.object({
  id: z.uuid(),
});
export type StartSubmissionOutputType = z.infer<typeof startSubmissionOutput>;

// ─── complete ──────────────────────────────────────────────────────────────
// `versionId` is required (always sent by the client; used as the INSERT
// fallback when no matching started row is found). `submissionId` is the
// optional upgrade hint — if it matches a `started` row, that row gets
// upgraded; otherwise a fresh row is inserted with both timestamps = now.
export const completeSubmissionInput = z.object({
  submissionId: z.uuid().optional(),
  versionId: z.uuid(),
  data: z.record(z.string(), z.unknown()),
  meta: clientMetaSchema,
  honeypot: z.string().optional(),
});
export type CompleteSubmissionInputType = z.infer<
  typeof completeSubmissionInput
>;

export const completeSubmissionOutput = z.object({
  id: z.uuid(),
  submittedAt: z.date(),
});
export type CompleteSubmissionOutputType = z.infer<
  typeof completeSubmissionOutput
>;

// ─── list ──────────────────────────────────────────────────────────────────
export const submissionStatusEnum = z.enum(["started", "completed"]);

export const listSubmissionsInput = z.object({
  formId: z.uuid(),
  requestedBy: z.uuid(),
  status: submissionStatusEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(200).default(50),
  cursor: z.string().optional(),
});
export type ListSubmissionsInputType = z.input<typeof listSubmissionsInput>;

const submissionListItem = z.object({
  id: z.uuid(),
  formId: z.uuid(),
  formVersionId: z.uuid(),
  status: submissionStatusEnum,
  startedAt: z.date(),
  submittedAt: z.date().nullable(),
  data: z.unknown(),
  meta: z.unknown().nullable(),
});

export const listSubmissionsOutput = z.object({
  items: z.array(submissionListItem),
  nextCursor: z.string().optional(),
  totalCount: z.number().int().nonnegative(),
});
export type ListSubmissionsOutputType = z.infer<typeof listSubmissionsOutput>;

// ─── getById ───────────────────────────────────────────────────────────────
export const getSubmissionInput = z.object({
  id: z.uuid(),
  requestedBy: z.uuid(),
});
export type GetSubmissionInputType = z.infer<typeof getSubmissionInput>;

const versionEmbedded = z.object({
  id: z.uuid(),
  version: z.number().int().min(1),
  schema: z.unknown(),
});

export const getSubmissionOutput = z.object({
  id: z.uuid(),
  formId: z.uuid(),
  formVersionId: z.uuid(),
  status: submissionStatusEnum,
  startedAt: z.date(),
  submittedAt: z.date().nullable(),
  data: z.unknown(),
  meta: z.unknown().nullable(),
  version: versionEmbedded,
});
export type GetSubmissionOutputType = z.infer<typeof getSubmissionOutput>;

// ─── export (REST) ─────────────────────────────────────────────────────────
export const exportSubmissionsInput = z.object({
  formId: z.uuid(),
  requestedBy: z.uuid(),
  status: submissionStatusEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});
export type ExportSubmissionsInputType = z.input<typeof exportSubmissionsInput>;
