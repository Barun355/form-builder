import { z } from "zod";

export const statsOutputModel = z.object({
  totalForms: z.number().int().nonnegative(),
  totalFormsDeltaPct: z
    .number()
    .nullable()
    .describe("Fraction (0.12 = +12%) vs prior 30d; null if no baseline"),
  totalSubmissions: z.number().int().nonnegative(),
  totalSubmissionsDeltaPct: z.number().nullable(),
  completionRate: z.number().min(0).max(1),
  completionRateDeltaPct: z.number().nullable(),
  weeklySubmissions: z.number().int().nonnegative(),
  weeklySubmissionsDeltaPct: z.number().nullable(),
});

// Route-layer Zod must use a primitive scalar (`trpc-to-openapi` GET inputs
// only accept ZodString/Number/Boolean/BigInt/Date). The strict 7|30|90
// constraint stays at the service layer.
export const submissionTrendInputModel = z.object({
  days: z
    .number()
    .int()
    .min(1)
    .max(365)
    .optional()
    .describe(
      "Time window length in days. Valid values: 7, 30, 90. Defaults to 30.",
    ),
});

export const submissionTrendOutputModel = z.array(
  z.object({
    date: z.string().describe("YYYY-MM-DD"),
    count: z.number().int().nonnegative(),
  }),
);

export const recentSubmissionsInputModel = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe("Max items to return; default 5"),
});

export const recentSubmissionsOutputModel = z.array(
  z.object({
    id: z.uuid(),
    formId: z.uuid(),
    formTitle: z.string(),
    formSlug: z.string(),
    submittedAt: z.date(),
  }),
);
