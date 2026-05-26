import { z } from "zod";
import { userService } from "../../services";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import {
  clearAuthentication,
  setAuthentication,
} from "../../utils/cookie";
import { generatePath } from "../../utils/path-generator";
import {
  badRequest,
  conflict,
  notFound,
  unauthorized,
} from "../../utils/errors";
import {
  changePasswordInputModel,
  changePasswordOutputModel,
  createUserWithEmailAndPasswordInputModel,
  createUserWithEmailAndPasswordOutputModel,
  currentUserDetailsOutputModel,
  loginUserWithEmailAndPasswordInputModel,
  loginUserWithEmailAndPasswordOutputModel,
  signOutOutputModel,
  updateProfileInputModel,
  updateProfileOutputModel,
} from "./model";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
  createUserWithEmailAndPassword: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/createUserWithEmailAndPassword"),
        tags: TAGS,
        summary: "Create a new user with email and password",
        description:
          "Creates a new user with the provided email, full name, and password. The password is salted and hashed before storage. A unique per-user slug (`userGlobalFormSlug`) is generated automatically. On success a session cookie is set; no token is returned in the response body.",
        protect: false
      },
    })
    .input(createUserWithEmailAndPasswordInputModel)
    .output(createUserWithEmailAndPasswordOutputModel)
    .mutation(async ({ input, ctx }) => {
      const { fullName, email, password } = input;

      try {
        const { id, token } = await userService.createUserEmailAndPassword({
          fullName,
          email,
          password,
        });

        setAuthentication(ctx, token);
        return { id };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.toLowerCase().includes("already exists")) {
          throw conflict(message);
        }
        throw err;
      }
    }),

  loginUserWithEmailAndPassword: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/loginUserWithEmailAndPassword"),
        tags: TAGS,
        summary: "Login a user with email and password",
        description:
          "Verifies the email/password pair and sets a session cookie. The `token` field in the response body is deprecated and retained for backwards compatibility; the cookie is the authoritative carrier.",
      },
    })
    .input(loginUserWithEmailAndPasswordInputModel)
    .output(loginUserWithEmailAndPasswordOutputModel)
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      try {
        const { token, id } = await userService.loginUserWithEmailAndPassword({
          email,
          password,
        });

        setAuthentication(ctx, token);
        return { token, id };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.toLowerCase().includes("invalid email or password")) {
          throw unauthorized("Invalid email or password");
        }
        throw err;
      }
    }),

  getCurrentUserDetails: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getCurrentUserDetails"),
        tags: TAGS,
        summary: "Get current authenticated user details",
        description:
          "Returns the currently authenticated user's profile, including their `userGlobalFormSlug`. Requires a valid session cookie.",
      },
    })
    .output(currentUserDetailsOutputModel)
    .query(async ({ ctx }) => {
      const user = await userService.getUserById(ctx.user.id);
      if (!user) throw notFound("User not found");

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        emailVerified: user.emailVerified,
        profileImageUrl: user.profileImageUrl,
        userGlobalFormSlug: user.userGlobalFormSlug,
        plan: user.plan,
      };
    }),

  signOut: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/signOut"),
        tags: TAGS,
        summary: "Sign the current user out",
        description: "Clears the session cookie. Requires authentication.",
      },
    })
    // Accept `{}` or undefined — tRPC's HTTP layer serializes a no-arg call
    // as `{}`, which `z.void()` (strictly undefined-only in Zod v4) rejects.
    .input(z.object({}).optional())
    .output(signOutOutputModel)
    .mutation(async ({ ctx }) => {
      clearAuthentication(ctx);
      return { ok: true as const };
    }),

  updateProfile: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/updateProfile"),
        tags: TAGS,
        summary: "Update the current user's profile",
        description:
          "Updates one or both of `fullName` and `profileImageUrl`. Pass `profileImageUrl: null` to clear the image. Email and slug are not updatable here.",
      },
    })
    .input(updateProfileInputModel)
    .output(updateProfileOutputModel)
    .mutation(async ({ input, ctx }) => {
      if (
        input.fullName === undefined &&
        input.profileImageUrl === undefined
      ) {
        throw badRequest(
          "At least one of fullName or profileImageUrl is required",
        );
      }

      try {
        const row = await userService.updateProfile({
          id: ctx.user.id,
          ...input,
        });
        return row;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.toLowerCase().includes("not found")) {
          throw notFound(message);
        }
        throw err;
      }
    }),

  changePassword: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/changePassword"),
        tags: TAGS,
        summary: "Change the current user's password",
        description:
          "Verifies the current password, sets a new one, and rotates the session cookie. Sessions on other devices are invalidated.",
      },
    })
    .input(changePasswordInputModel)
    .output(changePasswordOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        const { token } = await userService.changePassword({
          id: ctx.user.id,
          currentPassword: input.currentPassword,
          newPassword: input.newPassword,
        });
        setAuthentication(ctx, token);
        return { ok: true as const };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.toLowerCase().includes("current password is incorrect")) {
          throw unauthorized("Current password is incorrect");
        }
        if (message.toLowerCase().includes("not found")) {
          throw notFound(message);
        }
        throw err;
      }
    }),
});
