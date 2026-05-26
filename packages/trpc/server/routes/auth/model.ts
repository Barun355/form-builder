import { z } from "zod";

export const createUserWithEmailAndPasswordInputModel = z.object({
  fullName: z.string().min(1).max(80).describe("Full name of the user"),
  email: z.email().describe("Email address of the user"),
  password: z
    .string()
    .min(8)
    .max(72)
    .describe("Password (8–72 characters)"),
});

export const createUserWithEmailAndPasswordOutputModel = z.object({
  id: z.string().describe("Unique identifier for the user"),
});

export const loginUserWithEmailAndPasswordInputModel = z.object({
  email: z.email().describe("Email address of the user"),
  password: z.string().describe("Password for the user"),
});

export const loginUserWithEmailAndPasswordOutputModel = z.object({
  token: z
    .string()
    .describe(
      "JWT token for authenticated user. Deprecated: cookie is the authoritative carrier; this field is retained for backwards compatibility.",
    ),
  id: z.string().describe("Unique identifier for the user"),
});

export const currentUserDetailsOutputModel = z.object({
  id: z.string().describe("Unique identifier for the user"),
  email: z.email().describe("Email address of the user"),
  emailVerified: z
    .boolean()
    .describe("Whether the user's email has been verified"),
  fullName: z.string().describe("Full name of the user"),
  profileImageUrl: z
    .url()
    .describe("URL of the user's profile image")
    .optional()
    .nullable(),
  userGlobalFormSlug: z
    .string()
    .describe("Per-user slug used as the namespace in public form URLs"),
  plan: z
    .enum(["free", "pro", "business"])
    .describe(
      "Subscription tier — drives form-creation cap, submission visibility, and gated UI surfaces.",
    ),
});

export const signOutOutputModel = z.object({
  ok: z.literal(true),
});

// NOTE: `.refine()` removed deliberately — it produces a ZodEffects wrapper,
// which `trpc-to-openapi` can't `.omit()` over (Zod v4). The "at least one
// field required" check runs in the procedure handler instead.
export const updateProfileInputModel = z.object({
  fullName: z.string().min(1).max(80).optional(),
  profileImageUrl: z.url().nullable().optional(),
});

export const updateProfileOutputModel = z.object({
  id: z.string(),
  email: z.email(),
  fullName: z.string(),
  profileImageUrl: z.url().nullable(),
});

export const changePasswordInputModel = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

export const changePasswordOutputModel = z.object({
  ok: z.literal(true),
});
