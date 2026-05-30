import { RateLimiter } from "@repo/services/rate-limit";
import { env } from "@repo/services/env";

/**
 * Single shared instance per scope, lazily constructed so the limiter only
 * spins up if/when something actually consumes it (matters for the API
 * server cold-start path and for tests that don't exercise the limiters).
 */

export const submissionStartLimiter = new RateLimiter({
  name: "submission:start",
  limit: env.RATE_LIMIT_SUBMISSION_PER_MIN,
  windowMs: 60_000,
});

export const submissionCompleteLimiter = new RateLimiter({
  name: "submission:complete",
  limit: env.RATE_LIMIT_SUBMISSION_PER_MIN,
  windowMs: 60_000,
});

// Theme writes are keyed per-user (not per-IP) since they're behind
// `protectedProcedure`. Catches a runaway client that loops `create` or
// `update` without rate-limiting the rest of the app.
export const themeWriteLimiter = new RateLimiter({
  name: "theme:write",
  limit: env.RATE_LIMIT_THEME_PER_MIN,
  windowMs: 60_000,
});
