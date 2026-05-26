import { z } from "zod";

const formStatusEnum = z.enum(["draft", "published", "archived", "closed"]);

const aggregateBucket = z.object({
  value: z.string(),
  count: z.number().int().nonnegative(),
});

const audienceShape = z.object({
  deviceType: z.array(aggregateBucket),
  browser: z.array(aggregateBucket),
  os: z.array(aggregateBucket),
  locale: z.array(aggregateBucket),
  utmSource: z.array(aggregateBucket),
  utmMedium: z.array(aggregateBucket),
  utmCampaign: z.array(aggregateBucket),
  hasUtmData: z.boolean(),
});

// ─── per-form ──────────────────────────────────────────────────────────────

export const formKpisInput = z.object({
  formId: z.uuid(),
  requestedBy: z.uuid(),
});
export type FormKpisInputType = z.infer<typeof formKpisInput>;

export const formKpisOutput = z.object({
  totalStarts: z.number().int().nonnegative(),
  totalCompleted: z.number().int().nonnegative(),
  completionRate: z.number().min(0).max(1),
  medianTimeToCompleteSeconds: z.number().nullable(),
  meanTimeToCompleteSeconds: z.number().nullable(),
});
export type FormKpisOutputType = z.infer<typeof formKpisOutput>;

export const formTrendInput = z.object({
  formId: z.uuid(),
  requestedBy: z.uuid(),
  days: z.number().int().min(1).max(365).default(30),
});
export type FormTrendInputType = z.input<typeof formTrendInput>;

export const formTrendOutput = z.array(
  z.object({
    date: z.string(),
    count: z.number().int().nonnegative(),
  }),
);
export type FormTrendOutputType = z.infer<typeof formTrendOutput>;

export const formAudienceInput = z.object({
  formId: z.uuid(),
  requestedBy: z.uuid(),
});
export type FormAudienceInputType = z.infer<typeof formAudienceInput>;

export const formAudienceOutput = audienceShape;
export type FormAudienceOutputType = z.infer<typeof formAudienceOutput>;

export const formFieldsInput = z.object({
  formId: z.uuid(),
  requestedBy: z.uuid(),
});
export type FormFieldsInputType = z.infer<typeof formFieldsInput>;

const fieldDistribution = z.object({
  fieldId: z.string(),
  fieldType: z.enum([
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
  ]),
  label: z.string(),
  responseCount: z.number().int().nonnegative(),
  responseRate: z.number().min(0).max(1),
  distribution: z.array(aggregateBucket).optional(),
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

export const formFieldsOutput = z.object({
  versionId: z.uuid().nullable(),
  versionNumber: z.number().int().min(1).nullable(),
  fields: z.array(fieldDistribution),
});
export type FormFieldsOutputType = z.infer<typeof formFieldsOutput>;

// ─── global ────────────────────────────────────────────────────────────────

export const globalKpisInput = z.object({
  requestedBy: z.uuid(),
});
export type GlobalKpisInputType = z.infer<typeof globalKpisInput>;

export const globalKpisOutput = z.object({
  totalForms: z.number().int().nonnegative(),
  activeForms: z.number().int().nonnegative(),
  totalSubmissionsAllTime: z.number().int().nonnegative(),
  avgCompletionRate: z.number().min(0).max(1),
});
export type GlobalKpisOutputType = z.infer<typeof globalKpisOutput>;

export const globalTopFormsInput = z.object({
  requestedBy: z.uuid(),
  limit: z.number().int().min(1).max(20).default(10),
});
export type GlobalTopFormsInputType = z.input<typeof globalTopFormsInput>;

export const globalTopFormsOutput = z.array(
  z.object({
    id: z.uuid(),
    title: z.string(),
    slug: z.string(),
    status: formStatusEnum,
    submissionCount: z.number().int().nonnegative(),
  }),
);
export type GlobalTopFormsOutputType = z.infer<typeof globalTopFormsOutput>;

export const globalAudienceInput = z.object({
  requestedBy: z.uuid(),
});
export type GlobalAudienceInputType = z.infer<typeof globalAudienceInput>;

export const globalAudienceOutput = audienceShape;
export type GlobalAudienceOutputType = z.infer<typeof globalAudienceOutput>;
