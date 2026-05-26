import { initTRPC } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { verifyToken } from "@repo/services/auth";
import { getUserPlan } from "@repo/services/plan-gating";

import { createContext } from "./context";
import { getAuthentication } from "./utils/cookie";
import { planLocked, unauthorized } from "./utils/errors";
import { userService } from "./services";

export const tRPCContext = initTRPC
  .meta<OpenApiMeta>()
  .context<typeof createContext>()
  .create({
    // Surface plan-lock reasons on the error response so the frontend can
    // branch on `error.data.planLocked` without parsing the message string.
    errorFormatter({ shape, error }) {
      const msg = error.message ?? "";
      const planLockedReason = msg.startsWith("PLAN_LOCKED:")
        ? msg.slice("PLAN_LOCKED:".length)
        : undefined;
      return {
        ...shape,
        data: {
          ...shape.data,
          planLocked: planLockedReason,
        },
      };
    },
  });

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;

export const protectedProcedure = tRPCContext.procedure.use(
  async ({ ctx, next }) => {
    const token = getAuthentication(ctx);
    if (!token) throw unauthorized();

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw unauthorized("Invalid or expired session");
    }

    if (!payload?.id) throw unauthorized("Invalid session payload");

    // Validate that the token was issued AFTER the user's most recent password
    // change. Lets `changePassword` invalidate sessions on other devices.
    const user = await userService.getUserById(payload.id);
    if (!user) throw unauthorized("Session is no longer valid");

    if (payload.iat !== undefined) {
      const pwdChangedAtSec = Math.floor(
        user.passwordChangedAt.getTime() / 1000,
      );
      if (payload.iat < pwdChangedAtSec) {
        throw unauthorized("Session was revoked. Please sign in again.");
      }
    }

    return next({
      ctx: {
        ...ctx,
        user: {
          id: user.id,
        },
      },
    });
  },
);

/**
 * Paid-only procedure. Throws PLAN_LOCKED:advanced_analytics for Free users.
 * Used on per-form + global analytics routes and individual submission detail.
 * Frontend `<PlanGate>` short-circuits before the request even fires, but
 * this guard is the source of truth — DevTools can't bypass it.
 */
export const paidProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const plan = await getUserPlan(ctx.user.id);
  if (plan === "free") throw planLocked("advanced_analytics");
  return next({ ctx });
});
