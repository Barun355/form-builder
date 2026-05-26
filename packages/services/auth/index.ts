import * as JWT from "jsonwebtoken";
import { env } from "../env";

export interface TokenPayload {
  id: string;
  /** Issued-at in seconds since epoch (added by jsonwebtoken automatically). */
  iat?: number;
}

export function signToken(payload: Pick<TokenPayload, "id">): string {
  return JWT.sign(payload, env.JWT_SECRET);
}

export function verifyToken(token: string): TokenPayload {
  return JWT.verify(token, env.JWT_SECRET) as TokenPayload;
}

/**
 * The instant a token's `iat` represents — floor to whole seconds.
 * Use to align `passwordChangedAt` writes with JWT iat granularity so a
 * just-issued token isn't accidentally invalidated by sub-second drift.
 */
export function currentTokenSecond(): Date {
  return new Date(Math.floor(Date.now() / 1000) * 1000);
}
