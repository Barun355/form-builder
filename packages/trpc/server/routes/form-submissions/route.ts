import { formSubmissionsService } from "../../services";
import {
  protectedProcedure,
  publicProcedure,
  router,
} from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import {
  badRequest,
  forbidden,
  notFound,
  planLocked,
  tooManyRequests,
} from "../../utils/errors";
import { getClientIp } from "@repo/services/rate-limit";
import { getUserPlan } from "@repo/services/plan-gating";
import {
  submissionStartLimiter,
  submissionCompleteLimiter,
} from "../../utils/rate-limiters";
import {
  completeSubmissionInputModel,
  completeSubmissionOutputModel,
  getSubmissionInputModel,
  getSubmissionOutputModel,
  listSubmissionsInputModel,
  listSubmissionsOutputModel,
  startSubmissionInputModel,
  startSubmissionOutputModel,
} from "./model";

const TAGS = ["Form Submissions"];
const getPath = generatePath("/form-submissions");

function mapServiceError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  if (lower.includes("forbidden")) throw forbidden();
  if (lower.includes("not found")) throw notFound(message);
  if (
    lower.includes("not accepting") ||
    lower.includes("no longer accepts") ||
    lower.includes("already submitted") ||
    lower.includes("either submissionid") ||
    lower.includes("unknown field") ||
    lower.includes("must be") ||
    lower.includes("invalid cursor")
  ) {
    throw badRequest(message);
  }
  throw err;
}

export const formSubmissionsRouter = router({
  start: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/start"),
        tags: TAGS,
        protect: false,
        summary: "Register a form view as a 'started' submission",
        description:
          "Creates a submission row in 'started' state. Used to drive funnel analytics (started → completed). Honeypot field `_website`: if non-empty, the call silently succeeds without writing to the DB. Rate-limited per IP.",
      },
    })
    .input(startSubmissionInputModel)
    .output(startSubmissionOutputModel)
    .mutation(async ({ input, ctx }) => {
      const ip = getClientIp(ctx.req);
      const rl = submissionStartLimiter.consume(ip);
      if (!rl.allowed) throw tooManyRequests(rl.retryAfterMs);

      try {
        return await formSubmissionsService.start(input, ctx.req);
      } catch (err) {
        mapServiceError(err);
      }
    }),

  complete: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/complete"),
        tags: TAGS,
        protect: false,
        summary: "Finalize a submission",
        description:
          "Upgrades a 'started' row to 'completed' (pass submissionId), or inserts a new completed row in one shot (pass versionId + meta). Honeypot bypass applies. Rate-limited per IP.",
      },
    })
    .input(completeSubmissionInputModel)
    .output(completeSubmissionOutputModel)
    .mutation(async ({ input, ctx }) => {
      const ip = getClientIp(ctx.req);
      const rl = submissionCompleteLimiter.consume(ip);
      if (!rl.allowed) throw tooManyRequests(rl.retryAfterMs);

      try {
        return await formSubmissionsService.complete(input, ctx.req);
      } catch (err) {
        mapServiceError(err);
      }
    }),

  list: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/list"),
        tags: TAGS,
        summary: "List submissions for a form (owner only)",
        description:
          "Cursor-paginated. Filters: status, date range, full-text search across data. Newest first.",
      },
    })
    .input(listSubmissionsInputModel)
    .output(listSubmissionsOutputModel)
    .query(async ({ input, ctx }) => {
      try {
        return await formSubmissionsService.list({
          ...input,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  get: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/get"),
        tags: TAGS,
        summary: "Get a submission with its version's schema",
        description:
          "Returns the submission embedded with the version that was being filled when it was submitted. Plan-gated: Free users get PLAN_LOCKED:submission_detail.",
      },
    })
    .input(getSubmissionInputModel)
    .output(getSubmissionOutputModel)
    .query(async ({ input, ctx }) => {
      // Plan gate: individual submission detail is paid-only. Kept as
      // protectedProcedure (not paidProcedure) so other tools/UIs that
      // tangentially hit this don't break — gate is here, inline.
      const plan = await getUserPlan(ctx.user.id);
      if (plan === "free") throw planLocked("submission_detail");

      try {
        return await formSubmissionsService.getById({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),
});
