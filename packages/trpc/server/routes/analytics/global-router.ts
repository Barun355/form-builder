import { z } from "zod";

import { analyticsService } from "../../services";
import { paidProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import {
  globalAudienceOutputModel,
  globalKpisOutputModel,
  globalTopFormsInputModel,
  globalTopFormsOutputModel,
} from "./model";

const TAGS = ["Analytics — global"];
const getPath = generatePath("/analytics/global");

export const globalAnalyticsRouter = router({
  kpis: paidProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/kpis"),
        tags: TAGS,
        summary: "Cross-form KPI snapshot",
        description:
          "Total forms, active (published) form count, all-time completed submissions, and overall completion rate (weighted by start volume).",
      },
    })
    .input(z.void())
    .output(globalKpisOutputModel)
    .query(async ({ ctx }) => {
      return await analyticsService.globalKpis({ requestedBy: ctx.user.id });
    }),

  topForms: paidProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/topForms"),
        tags: TAGS,
        summary: "Top N forms by completed submission count",
      },
    })
    .input(globalTopFormsInputModel)
    .output(globalTopFormsOutputModel)
    .query(async ({ input, ctx }) => {
      return await analyticsService.globalTopForms({
        requestedBy: ctx.user.id,
        limit: input.limit,
      });
    }),

  audience: paidProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/audience"),
        tags: TAGS,
        summary: "Cross-form audience + UTM breakdown",
      },
    })
    .input(z.void())
    .output(globalAudienceOutputModel)
    .query(async ({ ctx }) => {
      return await analyticsService.globalAudience({ requestedBy: ctx.user.id });
    }),
});
