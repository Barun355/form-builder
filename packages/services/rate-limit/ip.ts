export interface MinimalRequest {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string | null };
  ip?: string | null;
}

/**
 * Best-effort client IP extraction. Prefers `x-forwarded-for` (first hop),
 * then `req.ip` (set by Express trust-proxy), then `req.socket.remoteAddress`.
 * Normalizes IPv4-mapped IPv6 addresses (`::ffff:1.2.3.4` → `1.2.3.4`).
 *
 * Returns "unknown" if nothing extractable — never undefined, so callers can
 * always form a stable key.
 */
export function getClientIp(req: MinimalRequest | undefined): string {
  if (!req) return "unknown";

  const xff = headerOf(req.headers, "x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return normalize(first);
  }

  if (req.ip) return normalize(req.ip);
  if (req.socket?.remoteAddress) return normalize(req.socket.remoteAddress);

  return "unknown";
}

function headerOf(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const v = headers[name] ?? headers[name.toLowerCase()];
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function normalize(ip: string): string {
  // ::ffff:1.2.3.4 → 1.2.3.4
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  return ip;
}
