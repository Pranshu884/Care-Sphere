const WINDOW_MS = Number(process.env.OTP_IP_WINDOW_MS || (10 * 60 * 1000)); // 10 minutes
const MAX_REQUESTS = Number(process.env.OTP_IP_MAX_SENDS || 10); // per window

// In-memory store (basic abuse protection; for multi-instance deployments use Redis).
const buckets = new Map(); // key -> { count, firstTs }

function allow(ip) {
  const key = String(ip || 'unknown');
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket) {
    buckets.set(key, { count: 1, firstTs: now });
    return { allowed: true };
  }

  const elapsed = now - bucket.firstTs;
  if (elapsed > WINDOW_MS) {
    buckets.set(key, { count: 1, firstTs: now });
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS) {
    const retryAfterMs = WINDOW_MS - elapsed;
    return { allowed: false, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
  }

  bucket.count += 1;
  buckets.set(key, bucket);
  return { allowed: true };
}

const ipRateLimit = { allow };

export default ipRateLimit;

