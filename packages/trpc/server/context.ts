import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import {
  clearCookieFactory,
  createCookieFactory,
  getCookieFactory,
} from "./utils/cookie";

export interface TRPCCtxUser {
  id: string;
}

/**
 * Narrow request shape exposed on the tRPC context. Intentionally avoids
 * importing express's full `Request<P, ResBody, ...>` generic to keep the
 * inferred procedure types portable (otherwise @types/express-serve-static-core
 * leaks into every downstream package's .d.ts).
 */
export interface TRPCRequest {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string | null };
  ip?: string | null;
}

/** Narrow response view used by responseMeta to set headers. */
export interface TRPCResponse {
  setHeader(name: string, value: string): void;
}

export interface TRPCContext {
  createCookie: ReturnType<typeof createCookieFactory>;
  getCookie: ReturnType<typeof getCookieFactory>;
  clearCookie: ReturnType<typeof clearCookieFactory>;

  /** Narrow request view — headers, socket, ip. */
  req: TRPCRequest;

  /** Narrow response view — for setting headers (e.g. Retry-After). */
  res: TRPCResponse;

  user?: TRPCCtxUser;
}

export async function createContext({
  req,
  res,
}: CreateExpressContextOptions): Promise<TRPCContext> {
  const ctx: TRPCContext = {
    createCookie: createCookieFactory(res),
    getCookie: getCookieFactory(req),
    clearCookie: clearCookieFactory(res),

    req: {
      headers: req.headers as Record<string, string | string[] | undefined>,
      socket: req.socket
        ? { remoteAddress: req.socket.remoteAddress ?? null }
        : undefined,
      ip: req.ip ?? null,
    },

    res: {
      setHeader: (name, value) => res.setHeader(name, value),
    },

    user: undefined,
  };
  return ctx;
}
export type Context = Awaited<ReturnType<typeof createContext>>;
