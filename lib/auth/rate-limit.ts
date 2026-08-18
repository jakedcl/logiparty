/**
 * In-memory login throttle. Per-instance on serverless (good enough for v1).
 * Keyed by org slug + email.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function loginAllowed(orgSlug: string, email: string): boolean {
  const now = Date.now();
  prune(now);
  const key = `${orgSlug.toLowerCase()}:${email.toLowerCase()}`;
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (existing.count >= MAX_ATTEMPTS) return false;
  existing.count += 1;
  return true;
}

export function clearLoginAttempts(orgSlug: string, email: string) {
  buckets.delete(`${orgSlug.toLowerCase()}:${email.toLowerCase()}`);
}
