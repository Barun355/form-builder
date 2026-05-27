import { z } from "zod";

const baseSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  MAIL_PROVIDER: z.enum(["nodemailer", "resend"]).default("resend"),
  MAIL_FROM: z
    .string()
    .min(1)
    .default("Simple Form <no-reply@simpleform.local>"),
  APP_ORIGIN: z.url().default("http://localhost:3000"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z
    .union([z.boolean(), z.string()])
    .transform((v) =>
      typeof v === "boolean" ? v : v === "true" || v === "1",
    )
    .default(false),
  RESEND_API_KEY: z.string().optional(),
});

const envSchema = baseSchema.superRefine((val, ctx) => {
  if (val.MAIL_PROVIDER === "nodemailer") {
    for (const key of ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"] as const) {
      if (!val[key] || val[key]?.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when MAIL_PROVIDER=nodemailer`,
        });
      }
    }
  }
  if (val.MAIL_PROVIDER === "resend" && !val.RESEND_API_KEY) {
    ctx.addIssue({
      code: "custom",
      path: ["RESEND_API_KEY"],
      message: "RESEND_API_KEY is required when MAIL_PROVIDER=resend",
    });
  }
});

function createEnv(env: NodeJS.ProcessEnv) {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) throw new Error(parsed.error.message);
  return parsed.data;
}

export type MailerEnv = z.infer<typeof envSchema>;
export const env = createEnv(process.env);
