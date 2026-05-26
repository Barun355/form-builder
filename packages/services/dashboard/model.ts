import { z } from "zod";

export const dashboardStatsInput = z.object({
  requestedBy: z.uuid(),
});
export type DashboardStatsInputType = z.infer<typeof dashboardStatsInput>;

export const dashboardStatsOutput = z.object({
  totalForms: z.number().int().nonnegative(),
  totalFormsDeltaPct: z.number().nullable(),
  totalSubmissions: z.number().int().nonnegative(),
  totalSubmissionsDeltaPct: z.number().nullable(),
  completionRate: z.number().min(0).max(1),
  completionRateDeltaPct: z.number().nullable(),
  weeklySubmissions: z.number().int().nonnegative(),
  weeklySubmissionsDeltaPct: z.number().nullable(),
});
export type DashboardStatsOutputType = z.infer<typeof dashboardStatsOutput>;

export const submissionTrendInput = z.object({
  requestedBy: z.uuid(),
  days: z.number().int().min(1).max(365).default(30),
});
export type SubmissionTrendInputType = z.input<typeof submissionTrendInput>;

export const submissionTrendOutput = z.array(
  z.object({
    date: z.string(), // YYYY-MM-DD
    count: z.number().int().nonnegative(),
  }),
);
export type SubmissionTrendOutputType = z.infer<typeof submissionTrendOutput>;

export const recentSubmissionsInput = z.object({
  requestedBy: z.uuid(),
  limit: z.number().int().min(1).max(20).default(5),
});
export type RecentSubmissionsInputType = z.input<typeof recentSubmissionsInput>;

export const recentSubmissionsOutput = z.array(
  z.object({
    id: z.uuid(),
    formId: z.uuid(),
    formTitle: z.string(),
    formSlug: z.string(),
    submittedAt: z.date(),
  }),
);
export type RecentSubmissionsOutputType = z.infer<
  typeof recentSubmissionsOutput
>;
