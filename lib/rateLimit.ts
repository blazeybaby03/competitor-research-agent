// Lightweight in-memory sliding-window rate limiter.
//
// Purpose: a cheap per-user cost guard in front of non-critical AI calls (e.g.
// competitor suggestions). It is PER-PROCESS — state is not shared across
// serverless instances — so it is a soft guard against runaway cost/abuse, not
// a hard quota. Hard quotas (report generation) stay DB-backed in their routes.
//
// The decision logic (evaluateRateLimit) is a pure function so it can be unit
// tested deterministically; checkRateLimit wraps it with a module-level store.

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

// Pure: given the existing hit timestamps for a key, decide whether a new hit
// at `now` is allowed, and return the timestamps to keep (including the new hit
// when allowed). No clocks, no global state — fully deterministic.
export function evaluateRateLimit(
  timestamps: number[],
  limit: number,
  windowMs: number,
  now: number
): RateLimitDecision & { kept: number[] } {
  const windowStart = now - windowMs;
  const kept = timestamps.filter((t) => t > windowStart);

  if (kept.length >= limit) {
    const oldest = kept[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, oldest + windowMs - now),
      kept,
    };
  }

  const next = [...kept, now];
  return { allowed: true, remaining: limit - next.length, retryAfterMs: 0, kept: next };
}

const buckets = new Map<string, number[]>();

// Stateful wrapper around evaluateRateLimit, keyed by an arbitrary string
// (e.g. `suggest:<userId>`). Records the hit when allowed.
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitDecision {
  const result = evaluateRateLimit(buckets.get(key) ?? [], limit, windowMs, now);
  buckets.set(key, result.kept);
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    retryAfterMs: result.retryAfterMs,
  };
}
