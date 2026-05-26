import { z } from "zod";

const envSchema = z
  .object({
    PORT: z.string().optional(),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    BASE_URL: z.string().default("http://localhost:8000"),
    CORS_ORIGIN: z
      .string()
      .optional()
      .describe(
        "Comma-separated list of allowed origins for credentialed CORS (dashboard). Required in production.",
      ),
  })
  .superRefine((val, ctx) => {
    if (val.NODE_ENV === "production" && !val.CORS_ORIGIN) {
      ctx.addIssue({
        code: "custom",
        path: ["CORS_ORIGIN"],
        message: "CORS_ORIGIN is required when NODE_ENV=production",
      });
    }
  });

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
