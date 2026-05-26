import { TRPCError } from "@trpc/server";

export const unauthorized = (message = "Not authenticated") =>
  new TRPCError({ code: "UNAUTHORIZED", message });

export const forbidden = (message = "You don't have access to this resource") =>
  new TRPCError({ code: "FORBIDDEN", message });

export const notFound = (message = "Resource not found") =>
  new TRPCError({ code: "NOT_FOUND", message });

export const badRequest = (message = "Bad request") =>
  new TRPCError({ code: "BAD_REQUEST", message });

export const conflict = (message = "Resource conflict") =>
  new TRPCError({ code: "CONFLICT", message });

export const internalError = (message = "Internal server error") =>
  new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });

export const notImplemented = (message = "Not implemented") =>
  new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Not implemented: ${message}` });

export const tooManyRequests = (
  retryAfterMs?: number,
  message = "Too many requests, please slow down",
) =>
  new TRPCError({
    code: "TOO_MANY_REQUESTS",
    message,
    cause:
      retryAfterMs !== undefined
        ? Object.assign(new Error(message), { retryAfterMs })
        : undefined,
  });

/**
 * Plan-gated feature was accessed by a user whose plan doesn't include it.
 * The reason string is propagated to the client via the errorFormatter so
 * the frontend can branch on `error.data.planLocked` ("form_limit",
 * "advanced_analytics", "submission_detail").
 */
export type PlanLockedReason =
  | "form_limit"
  | "advanced_analytics"
  | "submission_detail";

export const planLocked = (reason: PlanLockedReason, message?: string) =>
  new TRPCError({
    code: "FORBIDDEN",
    message: message ?? `PLAN_LOCKED:${reason}`,
  });
