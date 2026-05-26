import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Server-only env (never sent to the browser).
   */
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },

  /**
   * Client-side env (must be prefixed with NEXT_PUBLIC_).
   */
  client: {
    NEXT_PUBLIC_API_URL: z
      .url()
      .default("http://localhost:8000/trpc")
      .describe("Base URL of the API server (no trailing slash)."),
    NEXT_PUBLIC_APP_ORIGIN: z
      .url()
      .default("http://localhost:3000")
      .describe("Public origin of the web app — used by CORS allow-list."),
  },

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_ORIGIN: process.env.NEXT_PUBLIC_APP_ORIGIN,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
