import { z } from "zod";

const formStatusEnum = z.enum(["draft", "published", "archived", "closed"]);
const fieldTypeEnum = z.enum([
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
]);

const aggregateBucketModel = z.object({
  value: z.string(),
  count: z.number().int().nonnegative(),
});

const audienceOutputShape = z.object({
  deviceType: z.array(aggregateBucketModel),
  browser: z.array(aggregateBucketModel),
  os: z.array(aggregateBucketModel),
  locale: z.array(aggregateBucketModel),
  utmSource: z.array(aggregateBucketModel),
  utmMedium: z.array(aggregateBucketModel),
  utmCampaign: z.array(aggregateBucketModel),
  hasUtmData: z.boolean(),
});

// ─── per-form ──────────────────────────────────────────────────────────────

export const formKpisInputModel = z.object({
  formId: z.uuid(),
});

export const formKpisOutputModel = z.object({
  totalStarts: z.number().int().nonnegative(),
  totalCompleted: z.number().int().nonnegative(),
  completionRate: z.number().min(0).max(1),
  medianTimeToCompleteSeconds: z.number().nullable(),
  meanTimeToCompleteSeconds: z.number().nullable(),
});

export const formTrendInputModel = z.object({
  formId: z.uuid(),
  days: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .describe(
      "Time window length in days. Recommended: 7, 30, 90. Defaults to 30.",
    ),
});

export const formTrendOutputModel = z.array(
  z.object({
    date: z.string(),
    count: z.number().int().nonnegative(),
  }),
);

export const formAudienceInputModel = z.object({
  formId: z.uuid(),
});

export const formAudienceOutputModel = audienceOutputShape;

export const formFieldsInputModel = z.object({
  formId: z.uuid(),
});

const fieldDistributionModel = z.object({
  fieldId: z.string(),
  fieldType: fieldTypeEnum,
  label: z.string(),
  responseCount: z.number().int().nonnegative(),
  responseRate: z.number().min(0).max(1),
  distribution: z.array(aggregateBucketModel).optional(),
  optionLabels: z.record(z.string(), z.string()).optional(),
  numberStats: z
    .object({
      count: z.number().int().nonnegative(),
      min: z.number(),
      max: z.number(),
      avg: z.number(),
      median: z.number(),
    })
    .optional(),
  histogram: z
    .array(
      z.object({
        bucket: z.number().int(),
        rangeStart: z.number(),
        rangeEnd: z.number(),
        count: z.number().int().nonnegative(),
      }),
    )
    .optional(),
});

export const formFieldsOutputModel = z.object({
  versionId: z.uuid().nullable(),
  versionNumber: z.number().int().min(1).nullable(),
  fields: z.array(fieldDistributionModel),
});

// ─── global ────────────────────────────────────────────────────────────────

export const globalKpisOutputModel = z.object({
  totalForms: z.number().int().nonnegative(),
  activeForms: z.number().int().nonnegative(),
  totalSubmissionsAllTime: z.number().int().nonnegative(),
  avgCompletionRate: z.number().min(0).max(1),
});

export const globalTopFormsInputModel = z.object({
  limit: z.number().int().min(1).max(20).optional(),
});

export const globalTopFormsOutputModel = z.array(
  z.object({
    id: z.uuid(),
    title: z.string(),
    slug: z.string(),
    status: formStatusEnum,
    submissionCount: z.number().int().nonnegative(),
  }),
);

export const globalAudienceOutputModel = audienceOutputShape;
