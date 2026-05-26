import { z } from "zod";

export const createUserWithEmailAndPasswordInput = z.object({
  fullName: z.string().trim().min(1).max(80).describe("Full name of the user"),
  email: z
    .email()
    .transform((e) => e.toLowerCase())
    .describe("Email address of the user (stored lowercased)"),
  password: z
    .string()
    .min(8)
    .max(72)
    .describe("Password for the user (8–72 chars)"),
});

export type CreateUserWithEmailAndPasswordInputType = z.infer<
  typeof createUserWithEmailAndPasswordInput
>;

export const loginUserWithEmailAndPasswordInput = z.object({
  email: z
    .email()
    .transform((e) => e.toLowerCase())
    .describe("Email address of the user"),
  password: z.string().min(1).describe("Password for the user"),
});

export type LoginUserWithEmailAndPasswordInputType = z.infer<
  typeof loginUserWithEmailAndPasswordInput
>;

export const generateUserTokenPayload = z.object({
  id: z.string().describe("uuid of the user"),
  email: z.email().describe("Email address of the user").optional(),
});

export type GenerateUserTokenPayloadType = z.infer<
  typeof generateUserTokenPayload
>;

export const updateProfileInput = z
  .object({
    id: z.uuid().describe("UUID of the user being updated"),
    fullName: z.string().trim().min(1).max(80).optional(),
    profileImageUrl: z.url().nullable().optional(),
  })
  .refine(
    (d) => d.fullName !== undefined || d.profileImageUrl !== undefined,
    { message: "At least one of fullName or profileImageUrl must be provided" },
  );

export type UpdateProfileInputType = z.infer<typeof updateProfileInput>;

export const changePasswordInput = z.object({
  id: z.uuid().describe("UUID of the user changing their password"),
  currentPassword: z.string().min(1).describe("Current password"),
  newPassword: z.string().min(8).max(72).describe("New password (8–72 chars)"),
});

export type ChangePasswordInputType = z.infer<typeof changePasswordInput>;
