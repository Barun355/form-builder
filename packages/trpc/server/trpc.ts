import { initTRPC } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import { verifyToken } from "@repo/services/auth";

import { createContext } from "./context";
import { getAuthentication } from "./utils/cookie";
import { unauthorized } from "./utils/errors";
import { userService } from "./services";

export const tRPCContext = initTRPC
  .meta<OpenApiMeta>()
  .context<typeof createContext>()
  .create({});

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
