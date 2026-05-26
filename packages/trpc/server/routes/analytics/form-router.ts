import { analyticsService } from "../../services";
import { paidProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { badRequest, forbidden, notFound } from "../../utils/errors";
import {
  formAudienceInputModel,
  formAudienceOutputModel,
  formFieldsInputModel,
  formFieldsOutputModel,
  formKpisInputModel,
  formKpisOutputModel,
  formTrendInputModel,
  formTrendOutputModel,
} from "./model";

const TAGS = ["Analytics — per form"];
const getPath = generatePath("/analytics/form");

function mapServiceError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  if (lower.includes("forbidden")) throw forbidden();
  if (lower.includes("not found")) throw notFound(message);
  if (lower.includes("cannot")) throw badRequest(message);
  throw err;
}

export const formAnalyticsRouter = router({
  kpis: paidProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/kpis"),
        tags: TAGS,
        summary: "Per-form KPI snapshot",
        description:
          "Returns starts, completed, completion rate, and time-to-complete stats (median + mean, in seconds). Time stats include only sessions where started_at < submitted_at.",
      },
    })
    .input(formKpisInputModel)
    .output(formKpisOutputModel)
    .query(async ({ input, ctx }) => {
      try {
        return await analyticsService.formKpis({
          formId: input.formId,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  trend: paidProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/trend"),
        tags: TAGS,
        summary: "Per-form daily submission counts",
      },
    })
    .input(formTrendInputModel)
    .output(formTrendOutputModel)
    .query(async ({ input, ctx }) => {
      try {
        return await analyticsService.formTrend({
          formId: input.formId,
          requestedBy: ctx.user.id,
          days: input.days,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  audience: paidProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/audience"),
        tags: TAGS,
        summary: "Per-form audience + UTM breakdown",
        description:
          "Top 8 + 'Other' buckets for device, browser, OS, locale, and UTM source/medium/campaign. `hasUtmData` is false when no submission has any UTM tag.",
      },
    })
    .input(formAudienceInputModel)
    .output(formAudienceOutputModel)
    .query(async ({ input, ctx }) => {
      try {
        return await analyticsService.formAudience({
          formId: input.formId,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  fields: paidProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/fields"),
        tags: TAGS,
        summary: "Per-field response distribution",
        description:
          "Computed against the published version's schema. Choice fields return value distributions; number fields return min/max/avg/median + 10-bin histogram; text fields return only response count + rate.",
      },
    })
    .input(formFieldsInputModel)
    .output(formFieldsOutputModel)
    .query(async ({ input, ctx }) => {
      try {
        return await analyticsService.formFields({
          formId: input.formId,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),
});
