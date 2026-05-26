import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";
import cookieParser from "cookie-parser";
import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@repo/trpc/server";

import { env } from "./env";
import { exportFormSubmissionsCsv } from "./routes/export-csv";

export const app = express();
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "Streamyst OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

const allowedOrigins = (env.CORS_ORIGIN ?? "http://localhost:3000,http://localhost:8000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Same-origin / curl requests have no Origin header — allow.
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

app.use(cookieParser())
app.use(express.json());

app.get("/", (req, res) => {
  return res.json({ message: "Streamyst is up and running..." });
});

app.get("/health", (req, res) => {
  return res.json({ message: "Streamyst server is healthy", healthy: true });
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

// REST endpoint: stream submissions CSV.
// Must be registered BEFORE the catch-all /api middleware below, otherwise
// the OpenAPI middleware will try to route this path through tRPC.
app.get("/api/forms/:id/export.csv", exportFormSubmissionsCsv);

// On TOO_MANY_REQUESTS, surface Retry-After in seconds so HTTP clients
// (curl, fetch) can back off without parsing the body. Pulls retryAfterMs
// from the TRPCError cause (set by `tooManyRequests(retryAfterMs)`).
function attachRetryAfterHeader(error: unknown, res: { setHeader(name: string, value: string): void }) {
  if (!error || typeof error !== "object") return;
  const code = (error as { code?: string }).code;
  if (code !== "TOO_MANY_REQUESTS") return;
  const cause = (error as { cause?: unknown }).cause;
  const retryAfterMs =
    cause && typeof cause === "object" && "retryAfterMs" in cause
      ? (cause as { retryAfterMs?: number }).retryAfterMs
      : undefined;
  if (typeof retryAfterMs === "number" && retryAfterMs > 0) {
    res.setHeader("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
  }
}

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
    responseMeta: ({ errors, ctx }) => {
      if (ctx?.res && errors.length > 0) attachRetryAfterHeader(errors[0], ctx.res);
      return {};
    },
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
    responseMeta: ({ errors, ctx }) => {
      if (ctx?.res && errors.length > 0) attachRetryAfterHeader(errors[0], ctx.res);
      return {};
    },
  }),
);

export default app;
