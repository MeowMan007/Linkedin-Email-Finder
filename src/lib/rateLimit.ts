// ============================================================
// Rate Limiting
// ============================================================

import { getRateLimitCount, incrementRateLimit } from './db';
import { RateLimitResult } from '@/types';

// Configurable limits
const UNAUTHENTICATED_LIMIT = parseInt(
  process.env.RATE_LIMIT_UNAUTHENTICATED ?? '5',
  10
);
const AUTHENTICATED_LIMIT = parseInt(
  process.env.RATE_LIMIT_AUTHENTICATED ?? '50',
  10
);

/**
 * Check and increment rate limit for an IP address.
 * Returns whether the request is allowed and remaining quota.
 */
export async function checkRateLimit(params: {
  ip: string;
  authenticated?: boolean;
}): Promise<RateLimitResult> {
  const { ip, authenticated = false } = params;
  const limit = authenticated ? AUTHENTICATED_LIMIT : UNAUTHENTICATED_LIMIT;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Get current count (before incrementing)
  const currentCount = await getRateLimitCount(ip, today);

  if (currentCount >= limit) {
    const resetAt = new Date();
    resetAt.setUTCHours(24, 0, 0, 0); // Reset at midnight UTC

    return {
      allowed: false,
      remaining: 0,
      limit,
      resetAt: resetAt.toISOString(),
    };
  }

  // Increment the counter
  const newCount = await incrementRateLimit(ip, today);

  const resetAt = new Date();
  resetAt.setUTCHours(24, 0, 0, 0);

  return {
    allowed: true,
    remaining: Math.max(0, limit - newCount),
    limit,
    resetAt: resetAt.toISOString(),
  };
}

/**
 * Get real IP from various headers (works behind proxies/Vercel).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1'; // fallback for local dev
}
