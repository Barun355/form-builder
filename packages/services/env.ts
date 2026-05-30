import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    JWT_SECRET: z
      .string()
      .min(8, "JWT_SECRET must be at least 8 characters")
      .describe(
        "Secret key used for signing JWT tokens. Keep secret; never expose in client-side code.",
      ),
    RATE_LIMIT_SUBMISSION_PER_MIN: z.coerce
      .number()
      .int()
      .positive()
      .default(30)
      .describe("Per-IP submission start/complete cap, per 60s window."),
    RATE_LIMIT_THEME_PER_MIN: z.coerce
      .number()
      .int()
      .positive()
      .default(30)
      .describe(
        "Per-user theme write (create/update/duplicate/publish/etc.) cap, per 60s window.",
      ),
  })
  .superRefine((val, ctx) => {
    if (val.NODE_ENV === "production" && val.JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: "custom",
        path: ["JWT_SECRET"],
        message: "JWT_SECRET must be at least 32 characters in production",
      });
    }
  });

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
