// ============================================================
// POST /api/verify-email
// Live SMTP Email Mailbox Pinger & Catch-All Verifier Endpoint
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { pingEmailSmtpFull } from '@/lib/smtpVerifier';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const ip = getClientIp(request);

  // Optional session
  const session = await auth();
  const userId = session?.user?.id ?? null;

  // Rate limit
  const rateLimit = await checkRateLimit({ ip, authenticated: !!userId });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Daily search/verification limit reached. Please try again tomorrow.',
        },
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt,
        },
      }
    );
  }

  // Parse body
  let email = '';
  try {
    const body = await request.json();
    email = body?.email?.trim?.() ?? '';
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_BODY',
          message: 'Request body must be valid JSON with an "email" string.',
        },
      },
      { status: 400 }
    );
  }

  if (!email) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MISSING_EMAIL',
          message: 'Please provide an email address to verify.',
        },
      },
      { status: 400 }
    );
  }

  logger.info('smtp_ping_request', {
    operation: 'api_verify_email',
    request_id: requestId,
    email,
  });

  try {
    const result = await pingEmailSmtpFull(email, 3500);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'SMTP verification failed';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SMTP_PING_FAILED',
          message: msg,
        },
      },
      { status: 500 }
    );
  }
}
