import { z } from "zod";

import { dashboardService } from "../../services";
import { protectedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import {
  recentSubmissionsInputModel,
  recentSubmissionsOutputModel,
  statsOutputModel,
  submissionTrendInputModel,
  submissionTrendOutputModel,
} from "./model";

const TAGS = ["Dashboard"];
const getPath = generatePath("/dashboard");

export const dashboardRouter = router({
  stats: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/stats"),
        tags: TAGS,
        summary: "Dashboard KPI snapshot with period-over-period deltas",
        description:
          "Returns total forms, total submissions, all-time completion rate, and last-7d submissions — each with a `deltaPct` comparing the current period to the previous period of the same length. Deltas are null when the previous period had zero data.",
      },
    })
    .input(z.void())
    .output(statsOutputModel)
    .query(async ({ ctx }) => {
      return await dashboardService.stats({ requestedBy: ctx.user.id });
    }),

  submissionTrend: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/submissionTrend"),
        tags: TAGS,
        summary: "Daily submission counts for the past N days",
        description:
          "Returns one item per day for `days` days, oldest first, zero-filled. Used to render the dashboard submission trend chart.",
      },
    })
    .input(submissionTrendInputModel)
    .output(submissionTrendOutputModel)
    .query(async ({ input, ctx }) => {
      return await dashboardService.submissionTrend({
        requestedBy: ctx.user.id,
        days: input.days,
      });
    }),

  recentSubmissions: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/recentSubmissions"),
        tags: TAGS,
        summary: "Most-recent N completed submissions across all forms",
        description:
          "Returns the latest completed submissions joined with their form title and slug, for the dashboard 'Recent submissions' card.",
      },
    })
    .input(recentSubmissionsInputModel)
    .output(recentSubmissionsOutputModel)
    .query(async ({ input, ctx }) => {
      return await dashboardService.recentSubmissions({
        requestedBy: ctx.user.id,
        limit: input.limit,
      });
    }),
});
