// Simple in-memory rate limiter
const hits = new Map<string, { count: number; resetAt: number }>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of hits) {
    if (now > val.resetAt) hits.delete(key);
  }
}, 60000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfter?: number;
}

// Preset rate limit configs
export const RATE_LIMITS = {
  auth: { limit: 5, windowMs: 60000 },      // 5/min for login
  api: { limit: 100, windowMs: 60000 },      // 100/min for general API
  admin: { limit: 30, windowMs: 60000 },     // 30/min for admin
  ocr: { limit: 20, windowMs: 60000 },       // 20/min for OCR
  upload: { limit: 10, windowMs: 60000 },     // 10/min for file upload
} as const;

export function rateLimitByUser(userId: string, tier: keyof typeof RATE_LIMITS): RateLimitResult {
  const config = RATE_LIMITS[tier];
  return checkRateLimit(`${tier}:${userId}`, config.limit, config.windowMs);
}

export function rateLimitByIP(request: { headers: { get(name: string): string | null } }, tier: keyof typeof RATE_LIMITS): RateLimitResult {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const config = RATE_LIMITS[tier];
  return checkRateLimit(`${tier}:${ip}`, config.limit, config.windowMs);
}

export function checkRateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, limit };
  }

  entry.count++;
  if (entry.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return { allowed: true, remaining: limit - entry.count, limit };
}
