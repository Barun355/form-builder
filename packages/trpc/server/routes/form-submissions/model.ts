import { z } from "zod";

const clientMetaModel = z
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

const submissionStatusEnum = z.enum(["started", "completed"]);

// ─── start ─────────────────────────────────────────────────────────────────
export const startSubmissionInputModel = z.object({
  versionId: z.uuid().describe("UUID of the form_version being submitted"),
  meta: clientMetaModel,
  honeypot: z
    .string()
    .optional()
    .describe(
      "Hidden field for spam protection — if non-empty, the request silently succeeds without persisting",
    ),
});

export const startSubmissionOutputModel = z.object({
  id: z.uuid().describe("UUID of the started submission row"),
});

// ─── complete ──────────────────────────────────────────────────────────────
export const completeSubmissionInputModel = z.object({
  submissionId: z
    .uuid()
    .optional()
    .describe(
      "Optional upgrade hint. If provided AND a 'started' row with this id exists, that row is UPDATEd to 'completed'. Otherwise a fresh row is INSERTed with both timestamps = now.",
    ),
  versionId: z
    .uuid()
    .describe(
      "Required. Used as the INSERT identity when no started row is found.",
    ),
  data: z
    .record(z.string(), z.unknown())
    .describe("Submission values keyed by field id"),
  meta: clientMetaModel,
  honeypot: z.string().optional(),
});

export const completeSubmissionOutputModel = z.object({
  id: z.uuid(),
  submittedAt: z.date(),
});

// ─── list ──────────────────────────────────────────────────────────────────
export const listSubmissionsInputModel = z.object({
  formId: z.uuid(),
  status: submissionStatusEnum.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(200).optional(),
  cursor: z.string().optional(),
});

const submissionItemModel = z.object({
  id: z.uuid(),
  formId: z.uuid(),
  formVersionId: z.uuid(),
  status: submissionStatusEnum,
  startedAt: z.date(),
  submittedAt: z.date().nullable(),
  data: z.unknown(),
  meta: z.unknown().nullable(),
});

export const listSubmissionsOutputModel = z.object({
  items: z.array(submissionItemModel),
  nextCursor: z.string().optional(),
  totalCount: z.number().int().nonnegative(),
});

// ─── get ───────────────────────────────────────────────────────────────────
export const getSubmissionInputModel = z.object({
  id: z.uuid(),
});

const versionEmbeddedModel = z.object({
  id: z.uuid(),
  version: z.number().int().min(1),
  schema: z.unknown(),
});

export const getSubmissionOutputModel = z.object({
  id: z.uuid(),
  formId: z.uuid(),
  formVersionId: z.uuid(),
  status: submissionStatusEnum,
  startedAt: z.date(),
  submittedAt: z.date().nullable(),
  data: z.unknown(),
  meta: z.unknown().nullable(),
  version: versionEmbeddedModel,
});
