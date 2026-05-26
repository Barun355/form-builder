import { logger } from "@repo/logger";

export interface RateLimitOptions {
  /** Human-readable name for logs (e.g. "submission:start"). */
  name: string;
  /** Max events per window. */
  limit: number;
  /** Window size in ms. */
  windowMs: number;
  /** Max distinct keys to retain in memory (LRU eviction). Default 10k. */
  maxKeys?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Requests remaining in the current window (post-decrement). */
  remaining: number;
  /** Ms until the window resets. Only meaningful when allowed=false. */
  retryAfterMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Generic fixed-window in-memory rate limiter.
 *
 * Stateless from caller perspective — caller picks the `key` (typically
 * `${scope}:${ip}` or `${scope}:${userId}`). Buckets older than `windowMs`
 * are lazily reset on read, and a periodic sweep evicts stale entries.
 *
 * NOT distributed-safe — in-memory only, fine for single-node deploys.
 * For multi-node (or to survive process restarts), back it with Redis.
 */
export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly opts: Required<RateLimitOptions>;
  private sweepTimer: NodeJS.Timeout | undefined;

  constructor(opts: RateLimitOptions) {
    this.opts = { maxKeys: 10_000, ...opts };
    // Sweep expired buckets every 60s. unref so it never blocks process exit.
    this.sweepTimer = setInterval(() => this.sweep(), 60_000);
    this.sweepTimer.unref?.();
  }

  consume(key: string): RateLimitResult {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + this.opts.windowMs };
    }

    bucket.count += 1;
    // Refresh insertion order to act as crude LRU (Map preserves insertion order).
    this.buckets.delete(key);
    this.buckets.set(key, bucket);

    // LRU cap — drop oldest entries if we're over.
    if (this.buckets.size > this.opts.maxKeys) {
      const oldestKey = this.buckets.keys().next().value;
      if (oldestKey !== undefined) this.buckets.delete(oldestKey);
    }

    const allowed = bucket.count <= this.opts.limit;
    const remaining = Math.max(0, this.opts.limit - bucket.count);
    const retryAfterMs = allowed ? 0 : Math.max(0, bucket.resetAt - now);

    if (!allowed) {
      logger.info("rate_limit_block", {
        event: "rate_limit_block",
        scope: this.opts.name,
        key,
        retryAfterMs,
      });
    }

    return { allowed, remaining, retryAfterMs };
  }

  /** Force-clear a key (e.g. after a successful auth) — optional. */
  reset(key: string): void {
    this.buckets.delete(key);
  }

  /** For tests + diagnostic scripts. */
  size(): number {
    return this.buckets.size;
  }

  /** For graceful shutdown in tests. */
  dispose(): void {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    this.sweepTimer = undefined;
    this.buckets.clear();
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

export { getClientIp } from "./ip";
